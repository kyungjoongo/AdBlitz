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

// Connect DB & Start
mongoose
  .connect(config.mongodbUri)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(config.port, () => {
      console.log(`AdBlitz API running on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
