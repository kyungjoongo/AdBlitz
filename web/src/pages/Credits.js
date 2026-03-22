import React, { useState } from 'react';
import { FiZap, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import './Credits.css';

const packages = [
  { id: 'starter', name: '스타터', credits: 10, price: 9900, desc: '가볍게 시작' },
  { id: 'basic', name: '베이직', credits: 30, price: 29000, desc: '소규모 쇼핑몰' },
  { id: 'pro', name: '프로', credits: 100, price: 79000, desc: '활발한 판매자', popular: true },
  { id: 'unlimited', name: '무제한', credits: 999, price: 99000, desc: '대행사 / 대량 생산' },
];

const plans = [
  { id: 'basic', name: '베이직', price: 29000, features: ['30 크레딧/월', '15초+30초 영상', '기본 템플릿', 'A/B/C 카피'] },
  { id: 'pro', name: '프로', price: 59000, popular: true, features: ['100 크레딧/월', '모든 영상 길이', '프리미엄 템플릿', 'A/B/C 카피', '자동 음성', '우선 처리'] },
  { id: 'premium', name: '프리미엄', price: 99000, features: ['무제한 크레딧', '모든 기능', '브랜드 커스터마이징', '광고 성과 분석', '전담 지원'] },
];

export default function Credits() {
  const { user, refreshUser } = useAuth();
  const [purchasing, setPurchasing] = useState(null);

  const handlePurchase = async (packageType) => {
    setPurchasing(packageType);
    try {
      await api.post('/credits/purchase', { packageType });
      await refreshUser();
      toast.success('크레딧이 충전되었습니다!');
    } catch (err) {
      toast.error(err.response?.data?.error || '충전 실패');
    } finally {
      setPurchasing(null);
    }
  };

  const handleSubscribe = async (plan) => {
    setPurchasing(plan);
    try {
      await api.post('/credits/subscribe', { plan });
      await refreshUser();
      toast.success('구독이 시작되었습니다!');
    } catch (err) {
      toast.error(err.response?.data?.error || '구독 실패');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="credits-page">
      <h1>크레딧 & 요금제</h1>
      <div className="current-credit">
        <FiZap /> 현재 크레딧: <strong>{user?.credits || 0}</strong>
        <span className="plan-badge">{user?.plan || 'free'}</span>
      </div>

      {/* 크레딧 패키지 */}
      <section className="section">
        <h2>크레딧 충전</h2>
        <div className="package-grid">
          {packages.map((pkg) => (
            <div key={pkg.id} className={`package-card ${pkg.popular ? 'popular' : ''}`}>
              {pkg.popular && <div className="popular-tag">인기</div>}
              <h3>{pkg.name}</h3>
              <p className="pkg-desc">{pkg.desc}</p>
              <div className="pkg-credits">{pkg.credits} 크레딧</div>
              <div className="pkg-price">₩{pkg.price.toLocaleString()}</div>
              <button
                onClick={() => handlePurchase(pkg.id)}
                className="btn-purchase"
                disabled={purchasing === pkg.id}
              >
                {purchasing === pkg.id ? '처리중...' : '충전하기'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 구독 플랜 */}
      <section className="section">
        <h2>월간 구독</h2>
        <div className="plan-grid">
          {plans.map((plan) => (
            <div key={plan.id} className={`plan-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="popular-tag">추천</div>}
              <h3>{plan.name}</h3>
              <div className="plan-price">
                ₩{plan.price.toLocaleString()}<span>/월</span>
              </div>
              <ul className="plan-features">
                {plan.features.map((f, i) => (
                  <li key={i}><FiCheck /> {f}</li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                className={`btn-subscribe ${plan.popular ? 'primary' : ''}`}
                disabled={purchasing === plan.id}
              >
                {purchasing === plan.id ? '처리중...' : user?.plan === plan.id ? '현재 플랜' : '구독하기'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
