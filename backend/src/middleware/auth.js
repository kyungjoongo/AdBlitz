const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '인증이 필요합니다' });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: '인증에 실패했습니다' });
  }
};
