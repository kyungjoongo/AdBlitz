const router = require('express').Router();
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const config = require('../config');
const auth = require('../middleware/auth');

/**
 * 회원가입 (Firestore 버전)
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const db = admin.firestore();

    const snapshot = await db.collection('users').where('email', '==', email.toLowerCase().trim()).get();
    if (!snapshot.empty) {
      return res.status(400).json({ error: '이미 가입된 이메일입니다' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name,
      plan: 'free',
      credits: 200, // 초기 크레딧 넉넉히!
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('users').add(newUser);
    const token = jwt.sign({ userId: docRef.id }, config.jwtSecret, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: { id: docRef.id, email: newUser.email, name: newUser.name, credits: newUser.credits, plan: newUser.plan },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * 로그인 (Firestore 버전)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = admin.firestore();

    const snapshot = await db.collection('users').where('email', '==', email.toLowerCase().trim()).get();
    if (snapshot.empty) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다' });
    }

    const token = jwt.sign({ userId: userDoc.id }, config.jwtSecret, { expiresIn: '30d' });

    res.json({
      token,
      user: { id: userDoc.id, email: userData.email, name: userData.name, credits: userData.credits, plan: userData.plan },
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
