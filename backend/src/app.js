const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const config = require('./config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/output', express.static(path.join(__dirname, '../tmp/videos')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/credits', require('./routes/credits'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/effects', require('./routes/effects'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start server first, then connect DB (Railway healthcheck needs port open)
const server = app.listen(config.port, () => {
  console.log(`AdBlitz API running on port ${config.port}`);
});

mongoose
  .connect(config.mongodbUri)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.error('MONGODB_URI:', config.mongodbUri ? '설정됨' : '미설정');
  });

module.exports = app;
