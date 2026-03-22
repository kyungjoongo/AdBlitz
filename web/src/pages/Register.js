import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('가입 완료! 무료 크레딧 3개가 지급되었습니다 🎉');
    } catch (err) {
      toast.error(err.response?.data?.error || '가입에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo"><FiZap /> AdBlitz</Link>
        <h1>무료 가입</h1>
        <p className="auth-sub">3개 광고 영상을 무료로 만들어보세요</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>이름</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" required />
          </div>
          <div className="form-group">
            <label>이메일</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required />
          </div>
          <div className="form-group">
            <label>비밀번호</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6자 이상" required minLength={6} />
          </div>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? '가입 중...' : '무료로 시작하기'}
          </button>
        </form>

        <p className="auth-link">
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}
