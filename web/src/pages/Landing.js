import React from 'react';
import { Link } from 'react-router-dom';
import { FiZap, FiPlay, FiTrendingUp, FiLayers, FiMic, FiBarChart2 } from 'react-icons/fi';
import './Landing.css';

export default function Landing() {
  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="logo"><FiZap /> AdBlitz</div>
        <div className="header-actions">
          <Link to="/login" className="btn-ghost">로그인</Link>
          <Link to="/register" className="btn-primary">무료 시작</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">AI 광고 영상 자동 생성</div>
        <h1>
          광고 매출 올려주는<br />
          영상 <span className="gradient-text">자동 생성</span>
        </h1>
        <p className="hero-sub">
          상품 정보만 넣으면 15초/30초 광고 영상이 완성됩니다.<br />
          TikTok, Instagram Reels, YouTube Shorts까지 한 번에.
        </p>
        <div className="hero-cta">
          <Link to="/register" className="btn-primary btn-lg">
            <FiZap /> 무료로 3개 영상 만들기
          </Link>
        </div>
        <p className="hero-note">신용카드 없이 시작 / 무료 크레딧 3개 제공</p>
      </section>

      {/* Features */}
      <section className="features">
        <h2>왜 AdBlitz인가요?</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <FiPlay className="feature-icon" />
            <h3>3초 후킹 자동 생성</h3>
            <p>첫 3초가 생명입니다. AI가 스크롤을 멈추게 할 후킹 문구를 자동 생성합니다.</p>
          </div>
          <div className="feature-card">
            <FiLayers className="feature-icon" />
            <h3>A/B/C 카피 테스트</h3>
            <p>하나의 상품으로 3개 버전을 동시 생성. 가장 잘 팔리는 카피를 찾으세요.</p>
          </div>
          <div className="feature-card">
            <FiTrendingUp className="feature-icon" />
            <h3>플랫폼 맞춤</h3>
            <p>TikTok, Instagram Reels, YouTube Shorts 비율과 길이를 자동으로 맞춰줍니다.</p>
          </div>
          <div className="feature-card">
            <FiMic className="feature-icon" />
            <h3>자동 음성 & 자막</h3>
            <p>자연스러운 광고 톤의 TTS와 자막이 자동으로 삽입됩니다.</p>
          </div>
          <div className="feature-card">
            <FiBarChart2 className="feature-icon" />
            <h3>광고 성과 분석</h3>
            <p>CTR, 전환율을 추적하고 성과가 낮으면 새 버전을 자동 추천합니다.</p>
          </div>
          <div className="feature-card">
            <FiZap className="feature-icon" />
            <h3>검증된 템플릿</h3>
            <p>"잘 팔리는 영상 구조"가 미리 준비되어 있습니다. 클릭 한 번으로 적용.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing">
        <h2>요금제</h2>
        <div className="pricing-grid">
          <div className="price-card">
            <h3>스타터</h3>
            <div className="price">무료</div>
            <ul>
              <li>3 크레딧 제공</li>
              <li>15초 영상</li>
              <li>기본 템플릿</li>
            </ul>
            <Link to="/register" className="btn-outline">시작하기</Link>
          </div>
          <div className="price-card popular">
            <div className="popular-badge">인기</div>
            <h3>프로</h3>
            <div className="price">₩59,000<span>/월</span></div>
            <ul>
              <li>100 크레딧/월</li>
              <li>15초 + 30초 영상</li>
              <li>프리미엄 템플릿</li>
              <li>A/B/C 테스트</li>
              <li>자동 음성</li>
            </ul>
            <Link to="/register" className="btn-primary">시작하기</Link>
          </div>
          <div className="price-card">
            <h3>프리미엄</h3>
            <div className="price">₩99,000<span>/월</span></div>
            <ul>
              <li>무제한 크레딧</li>
              <li>모든 기능</li>
              <li>브랜드 커스터마이징</li>
              <li>광고 성과 분석</li>
              <li>우선 지원</li>
            </ul>
            <Link to="/register" className="btn-outline">시작하기</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2026 AdBlitz. AI로 광고 매출을 올리세요.</p>
      </footer>
    </div>
  );
}
