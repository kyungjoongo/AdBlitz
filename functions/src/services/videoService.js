const { fal } = require('@fal-ai/client');
const config = require('../config');
const admin = require('firebase-admin');

let _falConfigured = false;
function ensureFalConfig() {
  if (!_falConfigured) {
    fal.config({ credentials: process.env.FAL_KEY || config.falKey });
    _falConfigured = true;
  }
}

/**
 * 진행 상황 업데이트 유틸리티 (Firestore)
 */
async function updateVideoProgress(videoId, progress, message) {
  try {
    console.log(`[Video Progress] ${progress}%: ${message}`);
    const db = admin.firestore();
    await db.collection('videos').doc(videoId).update({
      progress: progress,
      statusMessages: admin.firestore.FieldValue.arrayUnion(message)
    });
  } catch (err) {
    console.error('[Video Progress Update Error]:', err.message);
  }
}

/**
 * fal.ai Kling Video로 이미지 → AI 영상 생성 (URL 반환)
 */
async function generateAIVideoClip(imageUrl, prompt, clipIndex) {
  console.log(`[Video] Kling Video 클립 ${clipIndex} 생성 시작...`);
  const result = await fal.subscribe('fal-ai/kling-video/v1/standard/image-to-video', {
    input: {
      image_url: imageUrl,
      prompt: prompt || 'product showcase, smooth camera movement, professional lighting',
      duration: '5',
      aspect_ratio: '9:16',
    },
    logs: true
  });

  const videoUrl = result.data?.video?.url;
  if (!videoUrl) throw new Error(`Kling 클립 ${clipIndex} 실패`);
  return videoUrl;
}

/**
 * MiniMax Video (Hailuo) - 대체 모델
 */
async function generateMiniMaxVideoClip(imageUrl, prompt, clipIndex) {
  console.log(`[Video] MiniMax Video 클립 ${clipIndex} 생성 시작...`);
  const result = await fal.subscribe('fal-ai/minimax-video/image-to-video', {
    input: {
      image_url: imageUrl,
      prompt: prompt || 'product showcase, smooth camera movement',
      prompt_optimizer: true,
    },
    logs: true
  });

  const videoUrl = result.data?.video?.url;
  if (!videoUrl) throw new Error(`MiniMax 클립 ${clipIndex} 실패`);
  return videoUrl;
}

/**
 * 여러 AI 영상 클립을 생성 (병렬 처리, 100% 클라우드)
 */
async function generateAllClips(images, adCopy, duration) {
  const clipsNeeded = duration === 15 ? 3 : 6;
  const prompts = generateClipPrompts(adCopy, clipsNeeded);

  const clipPromises = [];
  for (let i = 0; i < clipsNeeded; i++) {
    const imgIndex = i % images.length;
    const imageUrl = images[imgIndex].url || images[imgIndex];

    clipPromises.push(
      generateAIVideoClip(imageUrl, prompts[i], i).catch((err) => {
        console.error(`[Video] Kling 클립 ${i} 실패, MiniMax 시도:`, err.message);
        return generateMiniMaxVideoClip(imageUrl, prompts[i], i).catch(() => null);
      })
    );
  }

  const clips = await Promise.all(clipPromises);
  return clips.filter(Boolean);
}

function generateClipPrompts(adCopy, count) {
  const phases = [
    `dramatic close-up, eye-catching first impression, ${adCopy.hook}`,
    'showing a problem situation, relatable everyday frustration',
    'product appears as the solution, product close-up with glowing lighting',
    'product in use, natural lifestyle shot',
    'satisfying result, bright and positive mood',
    'call to action, full product package shot, promotional feel',
  ];
  return Array.from({ length: count }, (_, i) => phases[i % phases.length] + ', vertical video, ad quality, professional lighting');
}

/**
 * [CLOUD ONLY] fal.ai 클라우드 합성을 이용한 최종 렌더링
 */
async function renderVideo({ videoId, product, adCopy, audioUrl, duration, platform }) {
  ensureFalConfig();
  await updateVideoProgress(videoId, 5, 'AI 영상 엔진 초기화 및 클라우드 준비...');

  // 1. 영상 클립 생성 (URL 리스트 반환)
  await updateVideoProgress(videoId, 10, 'AI 연출 시나리오에 따라 영상 소스 촬영 중...');
  const clips = await generateAllClips(product.images, adCopy, duration);
  
  if (clips.length === 0) throw new Error('AI 영상 클립 생성에 모두 실패했습니다.');
  await updateVideoProgress(videoId, 70, 'AI 클립 촬영 완료! 이제 클라우드 편집실에서 합성 작업을 시작합니다.');

  // 2. 클라우드에서 영상 합치기 (merge-videos)
  console.log('[Video] fal.ai merge-videos 시작');
  const mergedVideoResult = await fal.subscribe('fal-ai/ffmpeg-api/merge-videos', {
    input: {
      video_urls: clips,
      resolution: 'portrait_16_9'
    }
  });
  const mergedUrl = mergedVideoResult.data?.video?.url;
  await updateVideoProgress(videoId, 80, '클립 합성 완료! 성우 음성 동기화 중...');

  // 3. 성우 음성 입히기 (merge-audio-video)
  console.log('[Video] fal.ai merge-audio-video 시작');
  const finalAudioVideoResult = await fal.subscribe('fal-ai/ffmpeg-api/merge-audio-video', {
    input: {
      video_url: mergedUrl,
      audio_url: audioUrl,
    }
  });
  const videoWithAudioUrl = finalAudioVideoResult.data?.video?.url;
  await updateVideoProgress(videoId, 90, '음성 믹싱 완료! 마지막으로 AI 자동 자막을 생성합니다.');

  // 4. AI 자동 자막 생성 (auto-subtitle)
  console.log('[Video] fal.ai auto-subtitle 시작');
  const finalResult = await fal.subscribe('fal-ai/workflow-utilities/auto-subtitle', {
    input: {
      video_url: videoWithAudioUrl,
    }
  });
  
  const finalVideoUrl = finalResult.data?.video?.url;
  const finalThumbnailUrl = finalResult.data?.thumbnail?.url || clips[0].replace('.mp4', '.jpg'); // fallback

  await updateVideoProgress(videoId, 100, '모든 공정이 완료되었습니다! 이제 광고를 확인하세요.');

  return {
    videoUrl: finalVideoUrl,
    thumbnailUrl: finalThumbnailUrl,
    subtitleUrl: null, // auto-subtitle 모델이 직접 박아줌
    fileSize: 0,
    resolution: '1080x1920',
  };
}

/**
 * 초고속 음성 스왑 (클라우드 버전)
 */
async function swapAudioTrack({ originalVideoUrl, newAudioUrl, videoId }) {
  console.log('[Video] fal.ai Cloud Audio Swap 시작');
  const result = await fal.subscribe('fal-ai/ffmpeg-api/merge-audio-video', {
    input: {
      video_url: originalVideoUrl,
      audio_url: newAudioUrl,
    }
  });
  return { videoUrl: result.data?.video?.url };
}

module.exports = { renderVideo, swapAudioTrack };
