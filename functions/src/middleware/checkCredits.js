const config = require('../config');

module.exports = (creditType) => {
  return (req, res, next) => {
    const cost = config.credits[creditType] || 1;
    if (req.user.credits < cost) {
      return res.status(403).json({
        error: '크레딧이 부족합니다',
        required: cost,
        current: req.user.credits,
      });
    }
    req.creditCost = cost;
    next();
  };
};
