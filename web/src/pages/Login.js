import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('로그인 성공!');
    } catch (err) {
      toast.error(err.response?.data?.error || '로그인에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo"><FiZap /> AdBlitz</Link>
        <h1>로그인</h1>
        <p className="auth-sub">광고 매출을 올려볼까요?</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>이메일</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required />
          </div>
          <div className="form-group">
            <label>비밀번호</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6자 이상" required />
          </div>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="auth-link">
          계정이 없나요? <Link to="/register">무료 가입</Link>
        </p>
      </div>
    </div>
  );
}
