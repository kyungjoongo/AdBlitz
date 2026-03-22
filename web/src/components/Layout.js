import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiHome, FiPlus, FiCreditCard, FiLogOut, FiZap } from 'react-icons/fi';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <FiZap size={24} />
          <span>AdBlitz</span>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item">
            <FiHome /> <span>대시보드</span>
          </Link>
          <Link to="/products/new" className="nav-item">
            <FiPlus /> <span>새 광고 만들기</span>
          </Link>
          <Link to="/face-effect" className="nav-item">
            <span role="img" aria-label="mask">🎭</span> <span>얼굴 반전 밈 (신규)</span>
          </Link>
          <Link to="/credits" className="nav-item">
            <FiCreditCard /> <span>크레딧</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="credit-badge">
            <FiZap /> {user?.credits || 0} 크레딧
          </div>
          <div className="user-info">
            <span>{user?.name}</span>
            <button onClick={handleLogout} className="logout-btn">
              <FiLogOut />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
