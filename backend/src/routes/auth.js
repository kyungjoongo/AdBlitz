const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const auth = require('../middleware/auth');

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: '이미 가입된 이메일입니다' });
    }

    const user = await User.create({ email, password, name });
    const token = jwt.sign({ userId: user._id }, config.jwtSecret, {
      expiresIn: '30d',
    });

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name, credits: user.credits, plan: user.plan },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다' });
    }

    const token = jwt.sign({ userId: user._id }, config.jwtSecret, {
      expiresIn: '30d',
    });

    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name, credits: user.credits, plan: user.plan },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 내 정보
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
