const OpenAI = require('openai');
const config = require('../config');

const openai = new OpenAI({ apiKey: config.openaiApiKey });

/**
 * 상품 정보를 기반으로 광고 카피 A/B/C 3개 버전 생성
 */
async function generateAdCopy(product, platform, duration) {
  const durationLabel = duration === 15 ? '15초' : '30초';
  const platformMap = {
    tiktok: 'TikTok',
    reels: 'Instagram Reels',
    shorts: 'YouTube Shorts',
    feed: 'Instagram Feed',
  };

  const prompt = `당신은 대한민국 최고의 퍼포먼스 마케터입니다.
매출을 극대화하는 광고 카피를 작성해주세요.

## 상품 정보
- 상품명: ${product.name || '미정'}
- 가격: ${product.price ? product.price.toLocaleString() + (product.currency === 'KRW' ? '원' : product.currency) : '상담문의'}
- 특징/설명: ${product.description || (product.features ? product.features.join(', ') : '상세 설명 없음')}
- 타겟: ${product.targetAudience?.gender === 'all' ? '전체' : product.targetAudience?.gender === 'male' ? '남성' : product.targetAudience?.gender === 'female' ? '여성' : '전체'} ${product.targetAudience?.ageRange?.min || '20'}~${product.targetAudience?.ageRange?.max || '50'}세
${product.targetAudience?.description ? `- 타겟 설명: ${product.targetAudience.description}` : ''}
${product.category ? `- 카테고리: ${product.category}` : ''}

## 요구사항
- 플랫폼: ${platformMap[platform] || platform}
- 영상 길이: ${durationLabel}
- **반드시 3개 버전(A, B, C)을 생성해주세요**
- 각 버전은 다른 어프로치(감성/긴급/사회적증거 등)를 사용하세요

## 각 버전에 포함할 내용
1. hook: 첫 3초 후킹 문구 (스크롤을 멈추게 할 한 문장)
2. problem: 문제 제기 (공감 유도)
3. solution: 해결 (상품 소개)
4. cta: Call to Action (구매 유도)
5. fullScript: 전체 나레이션 스크립트 (${durationLabel} 분량)

반드시 아래 JSON 형식으로 응답하세요:
[
  {
    "version": "A",
    "hook": "...",
    "problem": "...",
    "solution": "...",
    "cta": "...",
    "fullScript": "..."
  },
  {
    "version": "B",
    "hook": "...",
    "problem": "...",
    "solution": "...",
    "cta": "...",
    "fullScript": "..."
  },
  {
    "version": "C",
    "hook": "...",
    "problem": "...",
    "solution": "...",
    "cta": "...",
    "fullScript": "..."
  }
]`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  const parsed = JSON.parse(content);

  // 응답이 배열이거나 { variants: [...] } 형태일 수 있음
  return Array.isArray(parsed) ? parsed : parsed.variants || parsed.copies || [parsed];
}

/**
 * 자막 생성 (스크립트에서 타이밍 자동 배분)
 */
function generateSubtitles(script, duration) {
  const sentences = script
    .split(/[.!?。]\s*/)
    .filter((s) => s.trim().length > 0);

  const timePerSentence = duration / sentences.length;
  const subtitles = [];

  sentences.forEach((text, i) => {
    subtitles.push({
      start: i * timePerSentence,
      end: (i + 1) * timePerSentence,
      text: text.trim(),
    });
  });

  return subtitles;
}

module.exports = { generateAdCopy, generateSubtitles };
