const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const Product = require('../models/Product');

// 이미지 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/products')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// 상품 등록
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const { name, price, currency, features, targetGender, targetAgeMin, targetAgeMax, targetDescription, category } = req.body;

    const images = (req.files || []).map((f) => ({
      url: `/uploads/products/${f.filename}`,
      key: f.filename,
    }));

    const product = await Product.create({
      userId: req.user._id,
      name,
      price: Number(price),
      currency: currency || 'KRW',
      images,
      features: typeof features === 'string' ? JSON.parse(features) : features,
      targetAudience: {
        gender: targetGender || 'all',
        ageRange: { min: Number(targetAgeMin) || 20, max: Number(targetAgeMax) || 40 },
        description: targetDescription,
      },
      category,
    });

    res.status(201).json({ product });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 내 상품 목록
router.get('/', auth, async (req, res) => {
  const products = await Product.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ products });
});

// 상품 상세
router.get('/:id', auth, async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
  if (!product) return res.status(404).json({ error: '상품을 찾을 수 없습니다' });
  res.json({ product });
});

// 상품 삭제
router.delete('/:id', auth, async (req, res) => {
  await Product.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  res.json({ message: '삭제되었습니다' });
});

module.exports = router;
