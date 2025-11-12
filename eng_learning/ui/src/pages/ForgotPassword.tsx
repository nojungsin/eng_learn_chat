// src/pages/ForgotPassword.tsx (최종 안전 버전)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css'; // 경로/대소문자 꼭 확인!

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async () => {
    setMsg(''); setErr('');
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErr('유효한 이메일을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      setMsg('재설정 링크를 이메일로 보냈어요. 메일함을 확인해주세요.');
    } catch (e: any) {
      setErr(e.message || '요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-root">
      <div className="forgot-card">
        <h2 className="forgot-title">비밀번호 재설정</h2>
        <p className="forgot-sub">가입한 이메일로 재설정 링크를 보내드려요.</p>

        <input
          className="forgot-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        {msg && <p className="forgot-success">{msg}</p>}
        {err && <p className="forgot-error">{err}</p>}

        <button className="forgot-btn mt-8" onClick={onSubmit} disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>

        <button className="forgot-link" onClick={() => navigate('/login')}>
          Back to login
        </button>
      </div>
    </div>
  );
}
