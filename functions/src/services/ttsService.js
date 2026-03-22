const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const OUTPUT_DIR = path.join(__dirname, '../../tmp/audio');

/**
 * 한국어 광고 보이스 프리셋
 * CapCut / 인스타 릴스 스타일 특이하고 재밌는 보이스 포함
 */
const VOICE_PRESETS = {
  // === 인스타/틱톡 트렌디 보이스 (CapCut 스타일) ===
  energetic_girl: { voice_id: 'Energetic_Girl', label: '에너지 넘치는 소녀 (인스타 인기)', speed: 1.15 },
  excited_boy: { voice_id: 'Excited_Boy', label: '흥분한 소년 (틱톡 인기)', speed: 1.1 },
  lively_girl: { voice_id: 'Lively_Girl', label: '활발한 소녀 (릴스 스타일)', speed: 1.15 },
  storyteller: { voice_id: 'Storyteller_Girl', label: '이야기꾼 소녀 (ASMR 광고)', speed: 1.05 },
  rapper: { voice_id: 'Rapper', label: '래퍼 (힙한 광고)', speed: 1.1 },
  anime_girl: { voice_id: 'Cute_Anime_Girl', label: '애니메이션 소녀', speed: 1.1 },
  cartoon_boy: { voice_id: 'cartoon_boy', label: '카툰 소년', speed: 1.1 },
  whispering: { voice_id: 'Whispering_Woman', label: '속삭이는 ASMR', speed: 1.0 },
  booming: { voice_id: 'Booming_Voice', label: '웅장한 목소리 (임팩트)', speed: 1.0 },
  robot: { voice_id: 'Robot', label: '로봇 (유니크)', speed: 1.05 },

  // === 프로 광고 보이스 ===
  female_pro: { voice_id: 'Newswoman', label: '프로 아나운서 여성', speed: 1.1 },
  female_bright: { voice_id: 'Sweet_Girl_2', label: '밝은 여성', speed: 1.1 },
  female_calm: { voice_id: 'Gentle_Woman', label: '차분한 여성', speed: 1.0 },
  female_cute: { voice_id: 'Cute_Girl', label: '귀여운 여성', speed: 1.05 },
  female_wise: { voice_id: 'Wise_Woman', label: '지적인 여성', speed: 1.0 },
  female_inspire: { voice_id: 'Inspirational_girl', label: '영감주는 소녀', speed: 1.05 },
  male_pro: { voice_id: 'narrator_male', label: '프로 나레이터 남성', speed: 1.05 },
  male_deep: { voice_id: 'Deep_Voice_Man', label: '깊은 남성', speed: 1.0 },
  male_bright: { voice_id: 'Bright_Boy', label: '밝은 남성', speed: 1.1 },
  male_determined: { voice_id: 'Determined_Man', label: '결연한 남성', speed: 1.05 },
  male_knight: { voice_id: 'Young_Knight', label: '젊은 기사', speed: 1.05 },

  // 기본 매핑 (인스타/틱톡 스타일 기본값)
  defaults: {
    female: 'energetic_girl',
    male: 'excited_boy',
  },
};

const { fal } = require('@fal-ai/client');

// fal.ai 클라이언트 초기화
fal.config({ credentials: config.falKey });

/**
 * 버퍼 또는 Blob을 fal.ai CDN에 업로드하여 URL 반환
 */
async function uploadToFal(data, mimeType = 'audio/mpeg') {
  const blob = new Blob([data], { type: mimeType });
  const url = await fal.storage.upload(blob);
  console.log(`[TTS] fal CDN 업로드 완료: ${url}`);
  return url;
}

/**
 * AI 음성 생성 통합 컨트롤러 (결과물은 늘 웹 URL 반환)
 */
async function generateSpeech(text, gender = 'female', language = 'ko', voiceStyle = null, engine = 'minimax') {
  // 광고 텍스트 전처리
  const processedText = preprocessAdText(text);

  // === 틱톡(TikTok) 비공식 API 엔진 ===
  if (engine === 'tiktok') {
    try {
      console.log(`[TTS] TikTok 비공식 API 시도`);
      const base64Audio = await callTikTokTTS(processedText, voiceStyle, gender);
      if (base64Audio) {
        const url = await uploadToFal(Buffer.from(base64Audio, 'base64'));
        return url;
      }
    } catch(err) {
      console.error('[TTS] TikTok API 실패, 기본 엔진으로 폴백:', err.message);
    }
  }

  // === 일레븐랩스(ElevenLabs) 엔진 ===
  if (engine === 'elevenlabs') {
    try {
      console.log(`[TTS] ElevenLabs API 시도`);
      const audioBuffer = await callElevenLabsTTS(processedText, voiceStyle);
      const url = await uploadToFal(audioBuffer);
      return url;
    } catch(err) {
      console.error('[TTS] ElevenLabs API 실패, 기본 엔진으로 폴백:', err.message);
    }
  }

  // === 기본 fal.ai MiniMax 엔진 ===
  if (!config.falKey) {
    throw new Error('fal.ai API Key가 필요합니다.');
  }

  // 보이스 프리셋 선택
  let fallbackKey = voiceStyle;
  if (!VOICE_PRESETS[fallbackKey]) {
    fallbackKey = VOICE_PRESETS.defaults[gender] || 'energetic_girl';
  }
  const preset = VOICE_PRESETS[fallbackKey];

  try {
    console.log(`[TTS] Speech-02-HD 시도 - voice: ${preset.voice_id} (${preset.label})`);
    const audioUrl = await callSpeech02HD(processedText, preset.voice_id, preset.speed || 1.1);
    if (audioUrl) return audioUrl;
  } catch (err) {
    console.error('[TTS] Speech-02-HD 실패:', err.message);
  }

  // 2차: MiniMax TTS (기본 모델)
  try {
    console.log('[TTS] MiniMax TTS 기본 모델 시도...');
    const audioUrl = await callMiniMaxTTS(processedText, preset.voice_id, preset.speed || 1.1);
    if (audioUrl) return audioUrl;
  } catch (err) {
    console.error('[TTS] MiniMax TTS 실패:', err.message);
  }

  throw new Error('모든 TTS 엔진 호출에 실패했습니다.');
}

/**
 * 광고 텍스트 전처리
 */
function preprocessAdText(text) {
  let processed = text;
  // 이모지 제거
  processed = processed.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  // 마크다운 기호 제거
  processed = processed.replace(/[#*_~`>]/g, '');
  // 연속 느낌표/물음표 정리
  processed = processed.replace(/!{2,}/g, '!');
  processed = processed.replace(/\?{2,}/g, '?');
  // 빈 줄 정리
  processed = processed.replace(/\n{3,}/g, '\n\n');
  return processed.trim();
}

/**
 * MiniMax Speech-02-HD API 호출 (동기, 고품질)
 */
async function callSpeech02HD(text, voiceId, speed = 1.1) {
  const response = await axios({
    method: 'POST',
    url: 'https://fal.run/fal-ai/minimax/speech-02-hd',
    headers: {
      'Authorization': `Key ${config.falKey}`,
      'Content-Type': 'application/json',
    },
    data: {
      text,
      voice_id: voiceId,
      speed,
      language: 'Korean',
    },
    timeout: 60000,
  });

  return response.data?.audio?.url || null;
}

/**
 * MiniMax TTS API 호출 (동기, 기본)
 */
async function callMiniMaxTTS(text, voiceId, speed = 1.1) {
  const response = await axios({
    method: 'POST',
    url: 'https://fal.run/fal-ai/minimax-tts/text-to-speech',
    headers: {
      'Authorization': `Key ${config.falKey}`,
      'Content-Type': 'application/json',
    },
    data: {
      text,
      voice_id: voiceId,
      speed,
    },
    timeout: 60000,
  });

  return response.data?.audio?.url || null;
}

/**
 * 광고 텍스트 전처리
 */
function preprocessAdText(text) {
  let processed = text;
  // 이모지 제거
  processed = processed.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  // 마크다운 기호 제거
  processed = processed.replace(/[#*_~`>]/g, '');
  // 연속 느낌표/물음표 정리
  processed = processed.replace(/!{2,}/g, '!');
  processed = processed.replace(/\?{2,}/g, '?');
  // 빈 줄 정리
  processed = processed.replace(/\n{3,}/g, '\n\n');
  return processed.trim();
}

/**
 * 틱톡 비공식 TTS API 호출 (Base64 반환)
 */
async function callTikTokTTS(text, voiceStyle, gender) {
  let voiceId = 'kr_002'; // default female
  if (voiceStyle && voiceStyle.startsWith('kr_')) {
    voiceId = voiceStyle;
  } else if (gender === 'male') {
    voiceId = 'kr_003';
  } else if (voiceStyle === 'lively_girl') {
    voiceId = 'kr_004'; 
  }

  const response = await axios({
    method: 'POST',
    url: 'https://tiktok-tts.weilnet.workers.dev/api/generation',
    headers: { 'Content-Type': 'application/json' },
    data: { text: text, voice: voiceId },
    timeout: 30000,
  });
  
  if (response.data && response.data.data) {
    return response.data.data; // Base64 string
  }
  throw new Error('TikTok API 응답에 오디오 데이터가 없습니다.');
}

/**
 * 일레븐랩스(ElevenLabs) TTS API 호출 (Buffer 반환)
 */
async function callElevenLabsTTS(text, voiceStyle) {
  let voiceId = voiceStyle || 'EXAVITQu4vr4xnSDxMaL'; 
  const apiKey = config.elevenLabsKey || process.env.ELEVENLABS_API_KEY; 
  
  if (!apiKey || apiKey === 'dummy_key') {
    throw new Error('ElevenLabs API Key가 설정되지 않았습니다.');
  }

  const response = await axios({
    method: 'POST',
    url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    data: {
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    },
    responseType: 'arraybuffer',
    timeout: 60000,
  });
  
  return Buffer.from(response.data);
}

module.exports = { generateSpeech, VOICE_PRESETS };
