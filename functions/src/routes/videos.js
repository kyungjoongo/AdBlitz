const router = require('express').Router();
const auth = require('../middleware/auth');
const checkCredits = require('../middleware/checkCredits');
const admin = require('firebase-admin');
const aiService = require('../services/aiService');
const videoService = require('../services/videoService');
const ttsService = require('../services/ttsService');
const Busboy = require('busboy');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Firebase Functions 호환 multipart 파싱 미들웨어
 * (Firebase가 rawBody를 제공하므로 multer 대신 busboy 사용)
 */
function parseMultipart(req, res, next) {
  const busboy = Busboy({ headers: req.headers });
  const fields = {};
  const fileWrites = [];

  busboy.on('field', (name, val) => { fields[name] = val; });

  busboy.on('file', (name, file, info) => {
    const { filename, mimeType } = info;
    const tmpPath = path.join(os.tmpdir(), `upload_${Date.now()}_${filename}`);
    const writeStream = fs.createWriteStream(tmpPath);
    file.pipe(writeStream);
    const promise = new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve({ path: tmpPath, mimetype: mimeType, filename }));
      writeStream.on('error', reject);
    });
    fileWrites.push(promise);
  });

  busboy.on('finish', async () => {
    try {
      const results = await Promise.all(fileWrites);
      // Reset req.body to only busboy-parsed fields (Firebase v2 pre-fills req.body with raw data)
      req.body = fields;
      req.file = results.length > 0 ? results[0] : null;
      next();
    } catch (err) {
      console.error('File write error:', err);
      res.status(400).json({ error: '파일 저장 오류' });
    }
  });

  busboy.on('error', (err) => {
    console.error('Busboy error:', err);
    res.status(400).json({ error: '파일 업로드 처리 오류' });
  });

  if (req.rawBody) {
    busboy.end(req.rawBody);
  } else {
    req.pipe(busboy);
  }
}

/**
 * 광고 영상 다이렉트 생성 (Firestore)
 */
router.post('/generate-direct', auth, parseMultipart, async (req, res) => {
  try {
    const { productName, description, duration, platform, template, voiceGender, voiceStyle, voiceEngine } = req.body;
    const db = admin.firestore();

    if (!req.file) return res.status(400).json({ error: '이미지를 첨부해야 합니다.' });
    if (!productName || !description) return res.status(400).json({ error: '상품 이름과 특징(설명)을 입력해야 합니다.' });

    const creditCost = parseInt(duration) === 15 ? 1 : 2;
    if (req.user.credits < creditCost) {
      try { fs.unlinkSync(req.file.path); } catch(e){}
      return res.status(403).json({ error: '크레딧이 부족합니다', required: creditCost, current: req.user.credits });
    }

    const localPath = req.file.path;
    const { fal } = require('@fal-ai/client');
    fal.config({ credentials: process.env.FAL_KEY });

    // 1. 이미지를 fal.ai CDN에 먼저 업로드
    const fileBuffer = fs.readFileSync(localPath);
    const blob = new Blob([fileBuffer], { type: req.file.mimetype });
    const imageUrl = await fal.storage.upload(blob);
    try { fs.unlinkSync(localPath); } catch(e){}

    // 2. 임시 상품 생성 (Firestore)
    const productRef = await db.collection('products').add({
      userId: req.user._id,
      name: productName,
      description,
      images: [{ url: imageUrl }],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 3. AI 카피 생성
    const productData = { id: productRef.id, name: productName, description, images: [{ url: imageUrl }] };
    const copyVariants = await aiService.generateAdCopy(productData, platform, duration);
    const selectedCopy = copyVariants[0];

    // 4. Video 레코드 생성 (Firestore)
    const videoData = {
      userId: req.user._id,
      productId: productRef.id,
      title: `${productName} - ${platform} 광고`,
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const videoRef = await db.collection('videos').add(videoData);

    // 5. 크레딧 차감
    await db.collection('users').doc(req.user._id).update({
      credits: admin.firestore.FieldValue.increment(-creditCost)
    });

    // 6. 먼저 즉시 응답 (모바일 클라이언트 타임아웃 방지)
    res.status(201).json({
      message: '영상 생성이 시작되었습니다.',
      video: { id: videoRef.id, _id: videoRef.id, ...videoData },
    });

    // 7. 응답 후 영상 처리 (await로 함수가 처리 완료까지 살아있도록 보장)
    try {
      await processVideo(videoRef.id, productData, selectedCopy, videoData.voiceSettings, parseInt(duration), platform);
    } catch (err) {
      console.error('Video processing error (direct):', err);
      db.collection('videos').doc(videoRef.id).update({ status: 'failed' }).catch(console.error);
    }
  } catch (error) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch(e){}
    res.status(500).json({ error: error.message || '서버 오류' });
  }
});

/**
 * 기존 영상 음성만 변경하여 재생성 (Firestore)
 */
router.post('/regenerate-voice/:id', auth, async (req, res) => {
  try {
    const { voiceGender, voiceStyle, voiceEngine } = req.body;
    const db = admin.firestore();
    
    const videoDoc = await db.collection('videos').doc(req.params.id).get();
    if (!videoDoc.exists || videoDoc.data().userId !== req.user._id) {
      return res.status(404).json({ error: '원본 영상을 찾을 수 없습니다' });
    }
    const originalVideo = videoDoc.data();

    if (!originalVideo.output?.videoUrl) {
      return res.status(400).json({ error: '완성된 원본 영상이 없습니다' });
    }

    const creditCost = 1;
    if (req.user.credits < creditCost) {
      return res.status(403).json({ error: '크레딧이 부족합니다', required: creditCost, current: req.user.credits });
    }

    const newVideoData = {
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const newVideoRef = await db.collection('videos').add(newVideoData);

    await db.collection('users').doc(req.user._id).update({
      credits: admin.firestore.FieldValue.increment(-creditCost)
    });

    res.status(201).json({ video: { id: newVideoRef.id, _id: newVideoRef.id, ...newVideoData }, message: '클라우드 음성 교체 작업이 시작되었습니다.' });

    try {
      await processVoiceRegenFast(newVideoRef.id, originalVideo, newVideoData.adCopy, newVideoData.voiceSettings);
    } catch (err) {
      console.error('Cloud voice swap error:', err);
      db.collection('videos').doc(newVideoRef.id).update({ status: 'failed' }).catch(console.error);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 비동기 영상 처리 (Firestore 호환)
async function processVideo(videoId, product, adCopy, voiceSettings, duration, platform) {
  try {
    const db = admin.firestore();
    const audioUrl = await ttsService.generateSpeech(
      adCopy.fullScript,
      voiceSettings.gender,
      voiceSettings.language,
      voiceSettings.voiceStyle,
      voiceSettings.engine
    );

    const result = await videoService.renderVideo({
      videoId,
      product,
      adCopy,
      audioUrl,
      duration: duration || 15,
      platform: platform || 'tiktok',
    });

    await db.collection('videos').doc(videoId).update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      output: {
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        fileSize: result.fileSize || 0,
        resolution: result.resolution || '1080x1920',
      },
    });
  } catch (err) {
    console.error('[ProcessVideo Error]:', err);
    await admin.firestore().collection('videos').doc(videoId).update({ status: 'failed' });
  }
}

// 초고속 클라우드 음성 교체 처리 (Firestore 호환)
async function processVoiceRegenFast(videoId, originalVideo, adCopy, voiceSettings) {
  try {
    const db = admin.firestore();
    const audioUrl = await ttsService.generateSpeech(
      adCopy.fullScript,
      voiceSettings.gender,
      voiceSettings.language,
      voiceSettings.voiceStyle,
      voiceSettings.engine
    );

    const result = await videoService.swapAudioTrack({
      originalVideoUrl: originalVideo.output.videoUrl,
      newAudioUrl: audioUrl,
      videoId
    });

    await db.collection('videos').doc(videoId).update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      output: {
        videoUrl: result.videoUrl,
        thumbnailUrl: originalVideo.output.thumbnailUrl,
        fileSize: 0,
        resolution: originalVideo.output.resolution,
      },
    });
  } catch (err) {
    console.error('Cloud voice swap fail:', err);
    await admin.firestore().collection('videos').doc(videoId).update({ status: 'failed' });
  }
}

/**
 * 내 영상 목록 가져오기 (Firestore)
 */
router.get('/', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('videos')
      .where('userId', '==', req.user._id)
      .orderBy('createdAt', 'desc')
      .get();
    
    const videos = [];
    snapshot.forEach(doc => {
      videos.push({ id: doc.id, _id: doc.id, ...doc.data() });
    });
    
    res.json({ videos });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * 영상 상세 가져오기 (Firestore)
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const videoDoc = await db.collection('videos').doc(req.params.id).get();
    
    if (!videoDoc.exists || videoDoc.data().userId !== req.user._id) {
      return res.status(404).json({ error: '영상을 찾을 수 없습니다' });
    }
    
    res.json({ video: { id: videoDoc.id, _id: videoDoc.id, ...videoDoc.data() } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * 영상 삭제 (Firestore)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const db = admin.firestore();
    const videoDoc = await db.collection('videos').doc(req.params.id).get();
    
    if (videoDoc.exists && videoDoc.data().userId === req.user._id) {
      await db.collection('videos').doc(req.params.id).delete();
    }
    
    res.json({ message: '삭제되었습니다' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
