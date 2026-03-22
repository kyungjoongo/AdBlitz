const router = require('express').Router();
const auth = require('../middleware/auth');
const checkCredits = require('../middleware/checkCredits');
const Video = require('../models/Video');
const Product = require('../models/Product');
const User = require('../models/User');
const aiService = require('../services/aiService');
const videoService = require('../services/videoService');
const ttsService = require('../services/ttsService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

// 광고 영상 다이렉트 생성 (이미지 업로드 포함)
router.post('/generate-direct', auth, upload.single('image'), async (req, res) => {
  try {
    const { productName, description, duration, platform, template, voiceGender, voiceStyle, voiceEngine } = req.body;
    
    if (!req.file) return res.status(400).json({ error: '이미지를 첨부해야 합니다.' });
    if (!productName || !description) return res.status(400).json({ error: '상품 이름과 특징(설명)을 입력해야 합니다.' });

    const creditCost = parseInt(duration) === 15 ? 1 : 2;
    if (req.user.credits < creditCost) {
      try { fs.unlinkSync(req.file.path); } catch(e){}
      return res.status(403).json({ error: '크레딧이 부족합니다', required: creditCost, current: req.user.credits });
    }

    const { filename, path: localPath } = req.file;
    const { fal } = require('@fal-ai/client');
    fal.config({ credentials: process.env.FAL_KEY || require('../config').falKey });
    
    // 1. 이미지를 fal.ai CDN에 먼저 업로드 (모든 엔진에서 접근 가능하게)
    const fileBuffer = fs.readFileSync(localPath);
    const blob = new Blob([fileBuffer], { type: req.file.mimetype });
    const imageUrl = await fal.storage.upload(blob);
    try { fs.unlinkSync(localPath); } catch(e){}

    // 2. 임시 상품 생성
    const product = await Product.create({
      userId: req.user._id,
      name: productName,
      description,
      images: [{ url: imageUrl }],
    });

    // 3. AI 카피 생성
    const copyVariants = await aiService.generateAdCopy(product, platform, duration);
    const selectedCopy = copyVariants[0];

    // 4. Video 레코드 생성
    const video = await Video.create({
      userId: req.user._id,
      productId: product._id,
      title: `${product.name} - ${platform} 광고`,
      duration: parseInt(duration),
      platform,
      template: template || 'default',
      adCopy: selectedCopy,
      copyVariants,
      voiceSettings: {
        gender: voiceGender || 'female',
        voiceStyle: voiceStyle || null,
        language: 'ko',
        engine: voiceEngine || 'minimax',
      },
      status: 'processing',
      creditsUsed: creditCost,
    });

    // 5. 크레딧 차감
    await User.findByIdAndUpdate(req.user._id, { $inc: { credits: -creditCost } });

    // 6. 비동기 영상 생성 (TTS URL전달)
    processVideo(video, product, selectedCopy).catch((err) => {
      console.error('Video processing error (direct):', err);
      Video.findByIdAndUpdate(video._id, { status: 'failed' }).catch(console.error);
    });

    res.status(201).json({
      message: '영상 생성이 시작되었습니다.',
      video,
    });
  } catch (error) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch(e){}
    res.status(500).json({ error: error.message || '서버 오류' });
  }
});

// 기존 광고 영상 생성 요청 (웹)
router.post('/generate', auth, async (req, res) => {
  try {
    const { productId, duration, platform, template, voiceGender, voiceStyle, voiceEngine, copyVariantIndex } = req.body;

    const creditCost = duration === 15 ? 1 : 2;
    if (req.user.credits < creditCost) {
      return res.status(403).json({ error: '크레딧이 부족합니다', required: creditCost, current: req.user.credits });
    }

    const product = await Product.findOne({ _id: productId, userId: req.user._id });
    if (!product) return res.status(404).json({ error: '상품을 찾을 수 없습니다' });

    const copyVariants = await aiService.generateAdCopy(product, platform, duration);
    const selectedCopy = copyVariants[copyVariantIndex || 0];

    const video = await Video.create({
      userId: req.user._id,
      productId: product._id,
      title: `${product.name} - ${platform} 광고`,
      duration,
      platform,
      template: template || 'default',
      adCopy: selectedCopy,
      copyVariants,
      voiceSettings: {
        gender: voiceGender || 'female',
        voiceStyle: voiceStyle || null,
        language: 'ko',
        engine: voiceEngine || 'minimax',
      },
      status: 'processing',
      creditsUsed: creditCost,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { credits: -creditCost } });

    processVideo(video, product, selectedCopy).catch((err) => {
      console.error('Video processing error:', err);
      Video.findByIdAndUpdate(video._id, { status: 'failed' }).catch(console.error);
    });

    res.status(201).json({
      video,
      message: '영상 생성이 시작되었습니다.',
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 기존 영상 음성만 변경하여 재생성 (초고속 클래우드 스왑)
router.post('/regenerate-voice/:id', auth, async (req, res) => {
  try {
    const { voiceGender, voiceStyle, voiceEngine } = req.body;
    const originalVideo = await Video.findOne({ _id: req.params.id, userId: req.user._id });
    if (!originalVideo || !originalVideo.output?.videoUrl) {
      return res.status(404).json({ error: '원본 영상이 없거나 준비되지 않았습니다' });
    }

    const creditCost = 1;
    if (req.user.credits < creditCost) {
      return res.status(403).json({ error: '크레딧이 부족합니다', required: creditCost, current: req.user.credits });
    }

    const newVideo = await Video.create({
      userId: req.user._id,
      productId: originalVideo.productId,
      title: `${originalVideo.title} (새로운 음성)`,
      duration: originalVideo.duration,
      platform: originalVideo.platform,
      template: originalVideo.template,
      adCopy: originalVideo.adCopy,
      voiceSettings: {
        gender: voiceGender || 'female',
        voiceStyle: voiceStyle || null,
        language: 'ko',
        engine: voiceEngine || 'minimax',
      },
      status: 'processing',
      creditsUsed: creditCost,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { credits: -creditCost } });

    processVoiceRegenFast(newVideo, originalVideo, newVideo.adCopy).catch((err) => {
      console.error('Cloud voice swap error:', err);
      Video.findByIdAndUpdate(newVideo._id, { status: 'failed' }).catch(console.error);
    });

    res.status(201).json({ video: newVideo, message: '클라우드 음성 교체 작업이 시작되었습니다.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 비동기 영상 처리 (100% 클라우드 버전)
async function processVideo(video, product, adCopy) {
  try {
    // 1. TTS 생성 (URL 반환)
    const audioUrl = await ttsService.generateSpeech(
      adCopy.fullScript,
      video.voiceSettings.gender,
      video.voiceSettings.language,
      video.voiceSettings.voiceStyle,
      video.voiceSettings.engine
    );

    // 2. 클라우드 영상 렌더링 (fal.ai)
    const result = await videoService.renderVideo({
      videoId: video._id.toString(),
      product,
      adCopy,
      audioUrl,
      duration: video.duration,
      platform: video.platform,
    });

    // 3. 완료 처리
    await Video.findByIdAndUpdate(video._id, {
      status: 'completed',
      completedAt: new Date(),
      output: {
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        fileSize: result.fileSize || 0,
        resolution: result.resolution || '1080x1920',
      },
    });
  } catch (err) {
    console.error('[ProcessVideo Error]:', err);
    await Video.findByIdAndUpdate(video._id, { status: 'failed' });
  }
}

// 초고속 클라우드 음성 교체 처리
async function processVoiceRegenFast(newVideo, originalVideo, adCopy) {
  try {
    const audioUrl = await ttsService.generateSpeech(
      adCopy.fullScript,
      newVideo.voiceSettings.gender,
      newVideo.voiceSettings.language,
      newVideo.voiceSettings.voiceStyle,
      newVideo.voiceSettings.engine
    );

    const result = await videoService.swapAudioTrack({
      originalVideoUrl: originalVideo.output.videoUrl,
      newAudioUrl: audioUrl,
      videoId: newVideo._id.toString()
    });

    await Video.findByIdAndUpdate(newVideo._id, {
      status: 'completed',
      completedAt: new Date(),
      output: {
        videoUrl: result.videoUrl,
        thumbnailUrl: originalVideo.output.thumbnailUrl,
        fileSize: 0,
        resolution: originalVideo.output.resolution,
      },
    });
  } catch (err) {
    console.error('Cloud voice swap fail:', err);
    await Video.findByIdAndUpdate(newVideo._id, { status: 'failed' });
  }
}

// 카피만 미리 생성 (프리뷰)
router.post('/preview-copy', auth, async (req, res) => {
  try {
    const { productId, platform, duration } = req.body;
    const product = await Product.findOne({ _id: productId, userId: req.user._id });
    if (!product) return res.status(404).json({ error: '상품을 찾을 수 없습니다' });

    const copyVariants = await aiService.generateAdCopy(product, platform, duration);
    res.json({ copyVariants });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 내 영상 목록
router.get('/', auth, async (req, res) => {
  const videos = await Video.find({ userId: req.user._id })
    .populate('productId', 'name images')
    .sort({ createdAt: -1 });
  res.json({ videos });
});

// 영상 상세
router.get('/:id', auth, async (req, res) => {
  const video = await Video.findOne({ _id: req.params.id, userId: req.user._id })
    .populate('productId');
  if (!video) return res.status(404).json({ error: '영상을 찾을 수 없습니다' });
  res.json({ video });
});

// 영상 삭제
router.delete('/:id', auth, async (req, res) => {
  await Video.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  res.json({ message: '삭제되었습니다' });
});

module.exports = router;
