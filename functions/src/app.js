const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const config = require('./config');

// Firebase Admin initialization (Once)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const app = express();

// Middleware
app.use(cors());
// multipart 요청은 body parser 건너뛰기 (busboy에서 직접 파싱)
app.use((req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) return next();
  express.json()(req, res, next);
});
app.use((req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) return next();
  express.urlencoded({ extended: true })(req, res, next);
});

// Routes (require after app is defined)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/credits', require('./routes/credits'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/effects', require('./routes/effects'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0 (Firestore)' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

module.exports = app;
