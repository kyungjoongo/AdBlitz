const axios = require('axios');
const fs = require('fs');
const config = require('../config');

/**
 * AI를 활용하여 두 가지 얼굴(스냅챗 트렌드 스타일) 변환
 */
async function generateFaceEffect(imagePath, type, gender = 'male') {
  try {
    const { fal } = require('@fal-ai/client');
    fal.config({ credentials: config.falKey });
    
    // 로컬 파일을 fal CDN에 업로드하여 안정적인 URL 획득
    const buffer = fs.readFileSync(imagePath);
    const ext = require('path').extname(imagePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    const blob = new Blob([buffer], { type: mimeType });
    const imageUrl = await fal.storage.upload(blob);

    let prompt = '';
    
    if (type === 'confident') {
      if (gender === 'female') {
         prompt = 'A photorealistic portrait of an extremely confident woman, gigastacy, fierce model face, striking makeup, elegant and powerful boss lady, looking proud and victorious, dramatic studio lighting, 8k resolution, highly detailed';
      } else {
         prompt = 'A photorealistic portrait of a confident man, gigachad face, strong jawline, sigma male style, handsome, looking confident and proud, dramatic studio lighting, 8k resolution, highly detailed';
      }
    } else if (type === 'cowering') {
      if (gender === 'female') {
         prompt = 'A photorealistic portrait of a cowering woman, sad, crying face, tears, shy, distressed, messy hair, looking miserable and pitiful, highly emotional, 8k resolution, detailed';
      } else {
         prompt = 'A photorealistic portrait of a cowering man, sad, crying face, tears, shy, distressed, messy hair, looking miserable and pitiful, highly emotional, 8k resolution, detailed';
      }
    } else {
      throw new Error('Invalid effect type');
    }

    // fal.ai Flux Image to Image API (개발 또는 프로 버전 사용)
    const response = await axios({
      method: 'POST',
      url: 'https://fal.run/fal-ai/flux/dev/image-to-image',
      headers: {
        'Authorization': `Key ${config.falKey}`,
        'Content-Type': 'application/json',
      },
      data: {
        image_url: imageUrl,
        prompt: prompt,
        strength: 0.85, // 원본 이미지에서 얼마나 바꿀지 (0.0~1.0)
      },
      timeout: 60000, // 60s
    });

    if (response.data && response.data.images && response.data.images.length > 0) {
      return response.data.images[0].url; // 변환된 이미지 URL
    }
    
    throw new Error('Image generation format not valid or missing URL');
  } catch (error) {
    console.error(`[Face Effect Error (${type})]:`, error.response?.data || error.message);
    throw new Error(`얼굴 변환 실패 (${type})`);
  }
}

module.exports = { generateFaceEffect };
