const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  title: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  duration: {
    type: Number, // 15 or 30
    required: true,
  },
  platform: {
    type: String,
    enum: ['tiktok', 'reels', 'shorts', 'feed'],
    required: true,
  },
  template: {
    type: String,
    default: 'default',
  },
  // AI 생성 콘텐츠
  adCopy: {
    hook: String,        // 첫 3초 후킹 문구
    problem: String,     // 문제 제기
    solution: String,    // 해결
    cta: String,         // Call to Action
    fullScript: String,  // 전체 스크립트
  },
  // A/B 테스트용 카피 버전들
  copyVariants: [{
    version: String, // A, B, C
    hook: String,
    problem: String,
    solution: String,
    cta: String,
    fullScript: String,
  }],
  // TTS 설정
  voiceSettings: {
    gender: {
      type: String,
      enum: ['male', 'female'],
      default: 'female',
    },
    voiceId: String,
    voiceStyle: String,
    language: {
      type: String,
      default: 'ko',
    },
    engine: {
      type: String,
      enum: ['minimax', 'tiktok', 'elevenlabs', 'fal_premium'], // elevenlabs kept for backwards compatibility
      default: 'minimax',
    },
  },
  // 결과물
  output: {
    videoUrl: String,
    thumbnailUrl: String,
    subtitleUrl: String,
    fileSize: Number,
    resolution: String,
  },
  // 광고 성과 (추후 연동)
  analytics: {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
  },
  creditsUsed: {
    type: Number,
    default: 1,
  },
  progress: {
    type: Number,
    default: 0,
  },
  statusMessages: [{
    type: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
});

module.exports = mongoose.model('Video', videoSchema);
