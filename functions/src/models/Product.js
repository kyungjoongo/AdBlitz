const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
  },
  currency: {
    type: String,
    default: 'KRW',
  },
  images: [{
    url: String,
    key: String, // S3 key
  }],
  features: [{
    type: String,
    trim: true,
  }],
  targetAudience: {
    gender: {
      type: String,
      enum: ['male', 'female', 'all'],
      default: 'all',
    },
    ageRange: {
      min: { type: Number, default: 20 },
      max: { type: Number, default: 40 },
    },
    description: String,
  },
  category: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', productSchema);
