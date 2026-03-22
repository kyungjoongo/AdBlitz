const router = require('express').Router();
const auth = require('../middleware/auth');

// 잘 팔리는 영상 구조 템플릿
const templates = [
  {
    id: 'hook-problem-solution',
    name: '후킹 → 문제 → 해결',
    description: '가장 기본적이고 효과적인 광고 구조',
    structure: ['hook', 'problem', 'solution', 'cta'],
    bestFor: ['쇼핑몰', '스마트스토어'],
    example: {
      hook: '99%가 모르는 비밀',
      problem: '이런 고민 있으셨죠?',
      solution: '이제 해결됩니다',
      cta: '지금 바로 확인하세요',
    },
  },
  {
    id: 'before-after',
    name: '비포 → 애프터',
    description: '변화를 극적으로 보여주는 구조',
    structure: ['before', 'transition', 'after', 'cta'],
    bestFor: ['뷰티', '다이어트', '인테리어'],
    example: {
      hook: '이거 사기 전에 꼭 보세요',
      problem: '쓰기 전 vs 쓴 후',
      solution: '이 차이 실화입니다',
      cta: '링크 클릭하면 할인가',
    },
  },
  {
    id: 'urgency',
    name: '긴급 → 한정',
    description: '긴급성과 희소성으로 즉시 구매 유도',
    structure: ['urgency', 'value', 'scarcity', 'cta'],
    bestFor: ['이벤트', '한정판', '세일'],
    example: {
      hook: '오늘까지만 이 가격',
      problem: '원래 5만원인데',
      solution: '지금 주문하면 50% 할인',
      cta: '마감 임박! 지금 바로',
    },
  },
  {
    id: 'social-proof',
    name: '사회적 증거',
    description: '다른 사람들의 반응으로 신뢰 구축',
    structure: ['hook', 'proof', 'benefit', 'cta'],
    bestFor: ['리뷰 많은 상품', '베스트셀러'],
    example: {
      hook: '10만명이 선택한 이유',
      problem: '리뷰 4.9점의 비밀',
      solution: '직접 써보니 진짜였습니다',
      cta: '나도 써보기',
    },
  },
  {
    id: 'storytelling',
    name: '스토리텔링',
    description: '짧은 이야기로 감성 자극',
    structure: ['situation', 'conflict', 'resolution', 'cta'],
    bestFor: ['브랜드', '감성 제품'],
    example: {
      hook: '이거 없으면 손해입니다',
      problem: '매일 고민했습니다',
      solution: '그러다 찾았습니다',
      cta: '당신도 만나보세요',
    },
  },
];

// 템플릿 목록
router.get('/', auth, (req, res) => {
  res.json({ templates });
});

// 템플릿 상세
router.get('/:id', auth, (req, res) => {
  const template = templates.find((t) => t.id === req.params.id);
  if (!template) return res.status(404).json({ error: '템플릿을 찾을 수 없습니다' });
  res.json({ template });
});

module.exports = router;
