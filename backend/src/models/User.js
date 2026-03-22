const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'pro', 'premium'],
    default: 'free',
  },
  credits: {
    type: Number,
    default: 3, // 무료 체험 크레딧
  },
  subscription: {
    planId: String,
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: false },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
