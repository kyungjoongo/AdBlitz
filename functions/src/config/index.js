require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/adblitz',
  jwtSecret: process.env.JWT_SECRET,
  openaiApiKey: process.env.OPENAI_API_KEY,
  falKey: process.env.FAL_KEY,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.AWS_S3_BUCKET,
    region: process.env.AWS_REGION,
  },
  cdnUrl: process.env.CDN_URL,

  // Video settings
  video: {
    outputDir: './tmp/videos',
    maxDuration: 30,
    formats: {
      tiktok: { width: 1080, height: 1920, ratio: '9:16' },
      reels: { width: 1080, height: 1920, ratio: '9:16' },
      shorts: { width: 1080, height: 1920, ratio: '9:16' },
      feed: { width: 1080, height: 1080, ratio: '1:1' },
    },
  },

  // Credit costs
  credits: {
    video15s: 1,
    video30s: 2,
    premiumVideo: 3,
  },
};
