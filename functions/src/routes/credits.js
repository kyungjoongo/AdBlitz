const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// 크레딧 잔액 조회
router.get('/', auth, (req, res) => {
  res.json({
    credits: req.user.credits,
    plan: req.user.plan,
    subscription: req.user.subscription,
  });
});

// 크레딧 충전 (결제 연동 전 간이 버전)
router.post('/purchase', auth, async (req, res) => {
  const { packageType } = req.body;

  const packages = {
    starter: { credits: 10, price: 9900 },
    basic: { credits: 30, price: 29000 },
    pro: { credits: 100, price: 79000 },
    unlimited: { credits: 999, price: 99000 },
  };

  const pkg = packages[packageType];
  if (!pkg) return res.status(400).json({ error: '유효하지 않은 패키지입니다' });

  // TODO: 실제 결제 연동 (토스페이먼츠 / 아임포트 등)
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $inc: { credits: pkg.credits } },
    { new: true }
  );

  res.json({
    message: `${pkg.credits} 크레딧이 충전되었습니다`,
    credits: user.credits,
    charged: pkg.price,
  });
});

// 구독 플랜 변경
router.post('/subscribe', auth, async (req, res) => {
  const { plan } = req.body;

  const plans = {
    basic: { price: 29000, monthlyCredits: 30 },
    pro: { price: 59000, monthlyCredits: 100 },
    premium: { price: 99000, monthlyCredits: 999 },
  };

  const selectedPlan = plans[plan];
  if (!selectedPlan) return res.status(400).json({ error: '유효하지 않은 플랜입니다' });

  // TODO: 실제 구독 결제 연동
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 1);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      plan,
      $inc: { credits: selectedPlan.monthlyCredits },
      subscription: {
        planId: plan,
        startDate: now,
        endDate,
        isActive: true,
      },
    },
    { new: true }
  );

  res.json({
    message: `${plan} 플랜으로 구독되었습니다`,
    user: { plan: user.plan, credits: user.credits, subscription: user.subscription },
  });
});

module.exports = router;
