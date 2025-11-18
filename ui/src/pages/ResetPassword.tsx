// src/pages/ResetPassword.tsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ResetPassword.css';

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function ResetPassword() {
  const q = useQuery();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = q.get('token') || '';
    setToken(t);
  }, [q]);

  const onSubmit = async () => {
    setErr(''); setMsg('');
    if (!token) {
      setErr('유효하지 않은 링크입니다.');
      return;
    }
    if (!password || password !== confirm) {
      setErr('비밀번호가 비어있거나 서로 다릅니다.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      setMsg('비밀번호가 변경되었어요. 이제 로그인할 수 있어요!');
      // UX: 잠깐 안내 후 로그인 화면으로
      setTimeout(() => navigate('/login'), 1200);
    } catch (e: any) {
      setErr(e.message || '재설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container narrow">
      <h2>새 비밀번호 설정</h2>
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
      />
      <input
        type="password"
        placeholder="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
      />
      {msg && <p className="success">{msg}</p>}
      {err && <p className="error">{err}</p>}
      <button onClick={onSubmit} disabled={loading}>
        {loading ? 'Updating…' : 'Update password'}
      </button>
      <button onClick={() => navigate('/login')} className="text-btn">Back to login</button>
    </div>
  );
}
