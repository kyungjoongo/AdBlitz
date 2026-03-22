import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiPlay, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import api from '../api/client';
import './Dashboard.css';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/products'),
      api.get('/videos'),
    ]).then(([prodRes, vidRes]) => {
      setProducts(prodRes.data.products);
      setVideos(vidRes.data.videos);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusIcon = (status) => {
    switch (status) {
      case 'completed': return <FiCheckCircle className="status-icon completed" />;
      case 'processing': return <FiClock className="status-icon processing" />;
      case 'failed': return <FiAlertCircle className="status-icon failed" />;
      default: return <FiClock className="status-icon" />;
    }
  };

  const statusLabel = (status) => {
    const map = { pending: '대기중', processing: '생성중', completed: '완료', failed: '실패' };
    return map[status] || status;
  };

  if (loading) return <div className="page-loading">로딩중...</div>;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>대시보드</h1>
        <Link to="/products/new" className="btn-primary">
          <FiPlus /> 새 광고 만들기
        </Link>
      </div>

      {/* 상품 목록 */}
      <section className="section">
        <h2>내 상품 ({products.length})</h2>
        {products.length === 0 ? (
          <div className="empty-state">
            <p>등록된 상품이 없습니다</p>
            <Link to="/products/new" className="btn-outline-sm">상품 등록하기</Link>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <div key={p._id} className="product-card">
                {p.images?.[0] && (
                  <img src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3000'}${p.images[0].url}`} alt={p.name} className="product-img" />
                )}
                <div className="product-info">
                  <h3>{p.name}</h3>
                  <p className="product-price">{Number(p.price).toLocaleString()}원</p>
                  <div className="product-features">
                    {p.features?.slice(0, 3).map((f, i) => (
                      <span key={i} className="tag">{f}</span>
                    ))}
                  </div>
                  <Link to={`/videos/generate/${p._id}`} className="btn-generate">
                    <FiPlay /> 광고 영상 생성
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 영상 목록 */}
      <section className="section">
        <h2>생성된 영상 ({videos.length})</h2>
        {videos.length === 0 ? (
          <div className="empty-state">
            <p>아직 생성된 영상이 없습니다</p>
          </div>
        ) : (
          <div className="video-grid">
            {videos.map((v) => (
              <Link key={v._id} to={`/videos/${v._id}`} className="video-card">
                <div className="video-thumb">
                  {v.output?.thumbnailUrl ? (
                    <img src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3000'}${v.output.thumbnailUrl}`} alt={v.title} />
                  ) : (
                    <div className="thumb-placeholder"><FiPlay /></div>
                  )}
                  <span className="video-duration">{v.duration}초</span>
                </div>
                <div className="video-info">
                  <h3>{v.title}</h3>
                  <div className="video-meta">
                    {statusIcon(v.status)}
                    <span>{statusLabel(v.status)}</span>
                    <span className="video-platform">{v.platform}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
