const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const User = require('../models/User'); // For credit check
const effectService = require('../services/effectService');

// Multer setup for image upload
// Using backend/uploads/temp for temporary files
let tempDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const upload = multer({
  dest: tempDir,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// 스냅챗 스타일 "자신있는(Confident) vs 쭈구리(Cowering)" 얼굴 생성기
router.post('/two-face', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '이미지 파일을 업로드해주세요. (form-data: field name "image")' });
    }

    const imagePath = req.file.path;
    const gender = req.body.gender || 'male'; // 기본값 남성

    // 크레딧 소모 지정 (테스트를 위해 1크레딧만 소모하도록 임의 책정)
    const creditCost = 1;

    // 크레딧 체크
    if (req.user.credits < creditCost) {
      try { fs.unlinkSync(imagePath); } catch(e){} // 파일 정리
      return res.status(403).json({ error: '크레딧이 부족합니다', required: creditCost, current: req.user.credits });
    }

    try {
      // 병렬 생성 시도 (수십 초 절약 가능)
      const [confidentFaceUrl, coweringFaceUrl] = await Promise.all([
        effectService.generateFaceEffect(imagePath, 'confident', gender),
        effectService.generateFaceEffect(imagePath, 'cowering', gender)
      ]);

      // 성공 시 크레딧 차감
      await User.findByIdAndUpdate(req.user._id, { $inc: { credits: -creditCost } });

      // 생성에 쓰인 임시 업로드 파일 지우기
      try { fs.unlinkSync(imagePath); } catch(e) {}

      res.status(201).json({
        message: '성공적으로 두 가지 얼굴 밈(Meme)이 생성되었습니다.',
        images: {
          confident: confidentFaceUrl,
          cowering: coweringFaceUrl
        }
      });
    } catch (apiError) {
      // fal.ai API 에러 시 임시 파일 지우고, 크레딧은 차감하지 않음
      try { fs.unlinkSync(imagePath); } catch(e) {}
      throw apiError;
    }

  } catch (error) {
    res.status(500).json({ error: error.message || '얼굴 변환 중 서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
