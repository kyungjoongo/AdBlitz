const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '인증이 필요합니다' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || config.jwtSecret);
    const admin = require('firebase-admin');
    const userDoc = await admin.firestore().collection('users').doc(decoded.userId).get();

    if (!userDoc.exists) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
    }

    const userData = userDoc.data();
    delete userData.password;
    req.user = { _id: userDoc.id, ...userData };
    next();
  } catch (err) {
    console.error('[AUTH] Error:', err.message);
    res.status(401).json({ error: '인증에 실패했습니다' });
  }
};
