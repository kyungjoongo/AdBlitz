import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiDownload, FiClock, FiCheckCircle, FiAlertCircle, FiBarChart2, FiArrowLeft, FiMic } from 'react-icons/fi';
import api from '../api/client';
import './VideoDetail.css';

export default function VideoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 음성 재생성 관련 상태
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showVoiceOptions, setShowVoiceOptions] = useState(false);
  const [voiceEngine, setVoiceEngine] = useState('minimax');
  const [voiceGender, setVoiceGender] = useState('female');
  const [voiceStyle, setVoiceStyle] = useState('energetic_girl');

  const handleRegenerateVoice = async () => {
    try {
      if (!window.confirm("1크레딧을 소모하여 새로운 음성으로 영상을 재생성하시겠습니까? (새로운 영상으로 복제됩니다)")) return;
      setIsRegenerating(true);
      const res = await api.post(`/videos/regenerate-voice/${id}`, { voiceEngine, voiceGender, voiceStyle });
      alert(res.data.message);
      navigate(`/videos/${res.data.video._id}`);
    } catch (error) {
      alert(error.response?.data?.error || '음성 재생성 실패');
    } finally {
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    const fetchVideo = () => {
      api.get(`/videos/${id}`)
        .then((res) => {
          setVideo(res.data.video);
          // 아직 처리중이면 5초마다 폴링
          if (res.data.video.status === 'processing' || res.data.video.status === 'pending') {
            setTimeout(fetchVideo, 5000);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };
    fetchVideo();
  }, [id]);

  if (loading) return <div className="page-loading">로딩중...</div>;
  if (!video) return <div className="page-loading">영상을 찾을 수 없습니다</div>;

  const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3000';

  return (
    <div className="video-detail">
      <Link to="/dashboard" className="back-link"><FiArrowLeft /> 대시보드</Link>

      <div className="detail-header">
        <h1>{video.title}</h1>
        <div className="detail-meta">
          <span className={`status-badge ${video.status}`}>
            {video.status === 'completed' && <FiCheckCircle />}
            {video.status === 'processing' && <FiClock />}
            {video.status === 'failed' && <FiAlertCircle />}
            {video.status === 'completed' ? '완료' : video.status === 'processing' ? '생성 중...' : video.status === 'failed' ? '실패' : '대기중'}
          </span>
          <span className="meta-item">{video.platform}</span>
          <span className="meta-item">{video.duration}초</span>
        </div>
      </div>

      <div className="detail-grid">
        {/* 영상 플레이어 */}
        <div className="player-section">
          {video.status === 'completed' && video.output?.videoUrl ? (
            <div className="video-player">
              <video controls src={`${baseUrl}${video.output.videoUrl}`} />
              <a
                href={`${baseUrl}${video.output.videoUrl}`}
                download
                className="btn-download"
              >
                <FiDownload /> 다운로드
              </a>
              
              <div style={{marginTop: '20px', padding: '15px', background: '#25252b', borderRadius: '10px'}}>
                <button 
                  className="btn-primary" 
                  onClick={() => setShowVoiceOptions(!showVoiceOptions)}
                  style={{width: '100%', marginBottom: showVoiceOptions ? '15px' : '0'}}
                >
                  <FiMic /> 음성 바꾸기 (1크레딧)
                </button>
                
                {showVoiceOptions && (
                  <div className="voice-options-panel">
                    <div className="form-group">
                      <label>AI 음성 엔진</label>
                      <select value={voiceEngine} onChange={e => {
                        setVoiceEngine(e.target.value);
                        if (e.target.value === 'tiktok') setVoiceStyle('kr_002');
                        else if (e.target.value === 'elevenlabs') setVoiceStyle('EXAVITQu4vr4xnSDxMaL');
                        else setVoiceStyle('energetic_girl');
                      }} className="form-input">
                        <option value="minimax">기본 (MiniMax - 숏폼 감성)</option>
                        <option value="tiktok">캡컷/틱톡 (TikTok - 오리지널 기계음)</option>
                        <option value="fal_premium">프리미엄 (fal.ai 초고음질 전문 성우)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>성별</label>
                      <select value={voiceGender} onChange={e => setVoiceGender(e.target.value)} className="form-input">
                        <option value="female">여성</option>
                        <option value="male">남성</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>보이스 스타일</label>
                      <select value={voiceStyle} onChange={e => setVoiceStyle(e.target.value)} className="form-input">
                        {voiceEngine === 'minimax' && (
                          <>
                            <option value="energetic_girl">에너지 넘치는 소녀</option>
                            <option value="excited_boy">흥분한 소년</option>
                            <option value="lively_girl">활발한 소녀</option>
                            <option value="storyteller">이야기꾼 소녀 (ASMR)</option>
                            <option value="rapper">래퍼</option>
                            <option value="booming">웅장한 목소리</option>
                            <option value="male_pro">프로 나레이터 (남성)</option>
                            <option value="female_pro">프로 나레이터 (여성)</option>
                          </>
                        )}
                        {voiceEngine === 'tiktok' && (
                          <>
                            <option value="kr_002">상쾌한 아가씨 (kr_002)</option>
                            <option value="kr_004">상큼한 소녀 (kr_004)</option>
                            <option value="kr_003">에너지 남성 (kr_003)</option>
                          </>
                        )}
                        {voiceEngine === 'fal_premium' && (
                          <>
                            <option value="female_pro">프리미엄 여성 성우 (차분함)</option>
                            <option value="male_pro">프리미엄 남성 성우 (신뢰감)</option>
                          </>
                        )}
                      </select>
                    </div>
                    <button 
                      className="btn-primary" 
                      onClick={handleRegenerateVoice}
                      disabled={isRegenerating}
                      style={{width: '100%'}}
                    >
                      {isRegenerating ? '생성 요청 중...' : '새 음성으로 영상 만들기'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : video.status === 'processing' ? (
            <div className="processing-state">
              <div className="spinner" />
              <h3>영상을 생성하고 있습니다</h3>
              <p>AI가 광고 영상을 만들고 있어요. 약 1~3분 소요됩니다.</p>
            </div>
          ) : (
            <div className="processing-state">
              <FiAlertCircle size={40} />
              <h3>영상 생성에 실패했습니다</h3>
              <p>다시 시도해주세요.</p>
            </div>
          )}
        </div>

        {/* 정보 패널 */}
        <div className="info-panel">
          {/* 광고 카피 */}
          <div className="info-card">
            <h3>광고 카피</h3>
            <div className="copy-detail">
              <div className="copy-row">
                <span className="copy-label">Hook (첫 3초)</span>
                <p className="copy-text hook-text">"{video.adCopy?.hook}"</p>
              </div>
              <div className="copy-row">
                <span className="copy-label">문제 제기</span>
                <p className="copy-text">{video.adCopy?.problem}</p>
              </div>
              <div className="copy-row">
                <span className="copy-label">해결</span>
                <p className="copy-text">{video.adCopy?.solution}</p>
              </div>
              <div className="copy-row">
                <span className="copy-label">CTA</span>
                <p className="copy-text">{video.adCopy?.cta}</p>
              </div>
            </div>
          </div>

          {/* A/B/C 버전 */}
          {video.copyVariants?.length > 1 && (
            <div className="info-card">
              <h3>A/B/C 카피 버전</h3>
              <div className="variants-list">
                {video.copyVariants.map((v, i) => (
                  <div key={i} className="variant-item">
                    <span className="variant-badge">{v.version || String.fromCharCode(65 + i)}</span>
                    <span>"{v.hook}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 전체 스크립트 */}
          <div className="info-card">
            <h3>전체 스크립트</h3>
            <p className="script-text">{video.adCopy?.fullScript}</p>
          </div>

          {/* 성과 분석 (향후) */}
          <div className="info-card">
            <h3><FiBarChart2 /> 광고 성과</h3>
            <div className="analytics-grid">
              <div className="analytic-item">
                <span className="analytic-value">{video.analytics?.views || 0}</span>
                <span className="analytic-label">조회수</span>
              </div>
              <div className="analytic-item">
                <span className="analytic-value">{video.analytics?.clicks || 0}</span>
                <span className="analytic-label">클릭수</span>
              </div>
              <div className="analytic-item">
                <span className="analytic-value">{(video.analytics?.ctr || 0).toFixed(1)}%</span>
                <span className="analytic-label">CTR</span>
              </div>
              <div className="analytic-item">
                <span className="analytic-value">{(video.analytics?.conversionRate || 0).toFixed(1)}%</span>
                <span className="analytic-label">전환율</span>
              </div>
            </div>
            <p className="analytics-note">광고 플랫폼 연동 시 자동 수집됩니다</p>
          </div>
        </div>
      </div>
    </div>
  );
}
