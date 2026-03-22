import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlay, FiClock, FiZap, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import './VideoGenerate.css';

export default function VideoGenerate() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [product, setProduct] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [copyVariants, setCopyVariants] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [settings, setSettings] = useState({
    duration: 15,
    platform: 'reels',
    template: 'hook-problem-solution',
    voiceEngine: 'minimax',
    voiceGender: 'female',
    voiceStyle: 'female_pro',
    selectedCopy: 0,
  });

  useEffect(() => {
    Promise.all([
      api.get(`/products/${productId}`),
      api.get('/templates'),
    ]).then(([prodRes, tmplRes]) => {
      setProduct(prodRes.data.product);
      setTemplates(tmplRes.data.templates);
    }).catch(() => toast.error('상품 정보를 불러올 수 없습니다'))
      .finally(() => setLoading(false));
  }, [productId]);

  const handlePreviewCopy = async () => {
    setPreviewLoading(true);
    try {
      const res = await api.post('/videos/preview-copy', {
        productId,
        platform: settings.platform,
        duration: settings.duration,
      });
      setCopyVariants(res.data.copyVariants);
      toast.success('카피 3개 버전이 생성되었습니다!');
    } catch (err) {
      toast.error(err.response?.data?.error || '카피 생성 실패');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/videos/generate', {
        productId,
        duration: settings.duration,
        platform: settings.platform,
        template: settings.template,
        voiceEngine: settings.voiceEngine,
        voiceGender: settings.voiceGender,
        voiceStyle: settings.voiceStyle,
        copyVariantIndex: settings.selectedCopy,
      });
      await refreshUser();
      toast.success('영상 생성이 시작되었습니다!');
      navigate(`/videos/${res.data.video._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || '생성 실패');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="page-loading">로딩중...</div>;
  if (!product) return <div className="page-loading">상품을 찾을 수 없습니다</div>;

  const creditCost = settings.duration === 15 ? 1 : 2;

  return (
    <div className="video-generate">
      <h1>광고 영상 생성</h1>
      <p className="page-sub">{product.name}</p>

      <div className="gen-grid">
        {/* 설정 패널 */}
        <div className="settings-panel">
          {/* 영상 길이 */}
          <div className="setting-card">
            <h3><FiClock /> 영상 길이</h3>
            <div className="option-group">
              {[15, 30].map((d) => (
                <button
                  key={d}
                  className={`option-btn ${settings.duration === d ? 'active' : ''}`}
                  onClick={() => setSettings({ ...settings, duration: d })}
                >
                  {d}초 <span>{d === 15 ? '1 크레딧' : '2 크레딧'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 플랫폼 */}
          <div className="setting-card">
            <h3><FiPlay /> 플랫폼</h3>
            <div className="option-group">
              {[
                { id: 'tiktok', label: 'TikTok' },
                { id: 'reels', label: 'Reels' },
                { id: 'shorts', label: 'Shorts' },
                { id: 'feed', label: 'Feed (1:1)' },
              ].map((p) => (
                <button
                  key={p.id}
                  className={`option-btn ${settings.platform === p.id ? 'active' : ''}`}
                  onClick={() => setSettings({ ...settings, platform: p.id })}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 템플릿 */}
          <div className="setting-card">
            <h3><FiZap /> 영상 구조 (템플릿)</h3>
            <div className="template-list">
              {templates.map((t) => (
                <button
                  key={t.id}
                  className={`template-btn ${settings.template === t.id ? 'active' : ''}`}
                  onClick={() => setSettings({ ...settings, template: t.id })}
                >
                  <strong>{t.name}</strong>
                  <span>{t.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 음성 소스(엔진) 선택 */}
          <div className="setting-card">
            <h3>🤖 AI 음성 엔진</h3>
            <div className="option-group">
              {[
                { id: 'minimax', label: 'MiniMax (숏폼 특화)' },
                { id: 'tiktok', label: 'TikTok (캡컷 기계음)' },
                { id: 'fal_premium', label: 'Premium (fal 최고음질 성우)' },
              ].map((e) => (
                <button
                  key={e.id}
                  className={`option-btn ${settings.voiceEngine === e.id ? 'active' : ''}`}
                  onClick={() => {
                    let defaultStyle = 'female_pro';
                    if (e.id === 'tiktok') defaultStyle = 'kr_002';
                    setSettings({ ...settings, voiceEngine: e.id, voiceStyle: defaultStyle, voiceGender: 'female' });
                  }}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* 음성 스타일 */}
          <div className="setting-card">
            <h3>음성 스타일</h3>
            <div className="voice-style-list">
              {settings.voiceEngine === 'minimax' && [
                { id: 'female_pro', gender: 'female', label: '여성 프로', desc: '아나운서 톤' },
                { id: 'female_bright', gender: 'female', label: '여성 밝은', desc: '활기찬 광고' },
                { id: 'energetic_girl', gender: 'female', label: '상큼한 소녀', desc: '에너지 걸' },
                { id: 'storyteller', gender: 'female', label: '나레이터', desc: 'ASMR 톤' },
                { id: 'male_pro', gender: 'male', label: '남성 프로', 신뢰감: '아나운서 톤' },
                { id: 'male_bright', gender: 'male', label: '남성 밝은', desc: '에너지 남성' },
              ].map((v) => (
                <button
                  key={v.id}
                  className={`template-btn ${settings.voiceStyle === v.id ? 'active' : ''}`}
                  onClick={() => setSettings({ ...settings, voiceStyle: v.id, voiceGender: v.gender })}
                >
                  <strong>{v.label}</strong>
                  <span>{v.desc}</span>
                </button>
              ))}

              {settings.voiceEngine === 'tiktok' && [
                { id: 'kr_002', gender: 'female', label: '상쾌한 아가씨', desc: '가장 익숙한 틱톡음' },
                { id: 'kr_004', gender: 'female', label: '상큼한 소녀', desc: '귀여운 감성' },
                { id: 'kr_003', gender: 'male', label: '활기찬 소년', desc: '장난꾸러기 톤' },
              ].map((v) => (
                <button
                  key={v.id}
                  className={`template-btn ${settings.voiceStyle === v.id ? 'active' : ''}`}
                  onClick={() => setSettings({ ...settings, voiceStyle: v.id, voiceGender: v.gender })}
                >
                  <strong>{v.label}</strong>
                  <span>{v.desc}</span>
                </button>
              ))}

              {settings.voiceEngine === 'fal_premium' && [
                { id: 'female_pro', gender: 'female', label: '프리미엄 여성 성우', desc: '차분하고 정돈된 톤' },
                { id: 'male_pro', gender: 'male', label: '프리미엄 남성 성우', desc: '지적인 신뢰감 톤' },
              ].map((v) => (
                <button
                  key={v.id}
                  className={`template-btn ${settings.voiceStyle === v.id ? 'active' : ''}`}
                  onClick={() => setSettings({ ...settings, voiceStyle: v.id, voiceGender: v.gender })}
                >
                  <strong>{v.label}</strong>
                  <span>{v.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 카피 미리보기 */}
        <div className="copy-panel">
          <div className="copy-header">
            <h3>AI 광고 카피</h3>
            <button onClick={handlePreviewCopy} className="btn-preview" disabled={previewLoading}>
              {previewLoading ? '생성중...' : 'A/B/C 카피 생성'}
            </button>
          </div>

          {copyVariants ? (
            <div className="copy-variants">
              {copyVariants.map((copy, i) => (
                <button
                  key={i}
                  className={`copy-card ${settings.selectedCopy === i ? 'selected' : ''}`}
                  onClick={() => setSettings({ ...settings, selectedCopy: i })}
                >
                  {settings.selectedCopy === i && <FiCheck className="check-icon" />}
                  <div className="copy-version">버전 {copy.version || String.fromCharCode(65 + i)}</div>
                  <div className="copy-hook">"{copy.hook}"</div>
                  <div className="copy-script">{copy.fullScript}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="copy-empty">
              <p>카피를 먼저 생성해주세요</p>
              <span>AI가 3개 버전의 광고 카피를 만들어드립니다</span>
            </div>
          )}

          {/* 생성 버튼 */}
          <button onClick={handleGenerate} className="btn-generate-final" disabled={generating}>
            <FiZap />
            {generating ? '영상 생성 중...' : `광고 영상 생성하기 (${creditCost} 크레딧)`}
          </button>
        </div>
      </div>
    </div>
  );
}
