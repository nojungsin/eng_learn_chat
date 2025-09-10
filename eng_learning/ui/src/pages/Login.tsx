import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../pages/Login.css';

type AuthResponse = {
  token?: string;
  user?: {
    id: string | number;
    username?: string;
    email?: string;
  };
};

export default function Login() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [form, setForm] = useState({
    usernameOrEmail: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '', // 🔹 추가
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setIsSignIn(true), 200);
    return () => clearTimeout(t);
  }, []);

  const toggleMode = () => {
    setError('');
    setForm({
      usernameOrEmail: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '', // 🔹 초기화
    });
    setIsSignIn((p) => !p);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const isEmail = (v: string) => /\S+@\S+\.\S+/.test(v);

  const loginSmart = async (identifier: string, password: string) => {
    const trimmed = identifier.trim();
    const tries: Array<Record<string, string>> = [];
    tries.push({ identifier: trimmed, password });
    if (isEmail(trimmed)) {
      tries.push({ email: trimmed, password });
      tries.push({ username: trimmed, password });
    } else {
      tries.push({ username: trimmed, password });
      tries.push({ email: trimmed, password });
    }

    let lastErrText = '';
    for (const payload of tries) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (res.ok) {
        const data: AuthResponse = text ? JSON.parse(text) : {};
        if (data?.token) localStorage.setItem('token', data.token);
        return data;
      }
      lastErrText = text || `HTTP ${res.status}`;
      if (![400, 401].includes(res.status)) break;
    }
    throw new Error(lastErrText || '로그인 실패');
  };

  const signup = async (username: string, email: string, password: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
    const data: AuthResponse = text ? JSON.parse(text) : {};
    if (data?.token) localStorage.setItem('token', data.token);
    return data;
  };

  // 🔹 실시간 비밀번호 불일치 여부
  const pwMismatch = useMemo(() => {
    if (isSignIn) return false;
    return !!form.password && !!form.confirmPassword && form.password !== form.confirmPassword;
  }, [isSignIn, form.password, form.confirmPassword]);

  const handleSubmit = async () => {
    setError('');

    if (isSignIn) {
      const idf = form.usernameOrEmail.trim();
      if (!idf || !form.password) {
        setError('아이디/이메일과 비밀번호를 입력해주세요.');
        return;
      }
      setLoading(true);
      try {
        await loginSmart(idf, form.password);
        navigate('/home');
      } catch (e: any) {
        setError(e?.message || '로그인에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    } else {
      // 🔹 회원가입 검증
      if (!form.username.trim() || !isEmail(form.email.trim()) || !form.password) {
        setError('유효한 사용자명/이메일/비밀번호를 입력해주세요.');
        return;
      }
      if (pwMismatch) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }
      setLoading(true);
      try {
        await signup(form.username, form.email, form.password);
        setIsSignIn(true);
      } catch (e: any) {
        setError(e?.message || '회원가입에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div id="container" className={`container ${isSignIn ? 'sign-in' : 'sign-up'}`}>
      <div className="row">
        {/* ---------- Sign Up ---------- */}
        <div className="col align-items-center flex-col sign-up">
          <div className="form-wrapper align-items-center">
            <div className="form sign-up">
              <div className="input-group">
                <i className="bx bxs-user"></i>
                <input
                  name="username"
                  type="text"
                  placeholder="Username"
                  value={form.username}
                  onChange={onChange}
                  autoComplete="username"
                />
              </div>
              <div className="input-group">
                <i className="bx bx-mail-send"></i>
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={onChange}
                  autoComplete="email"
                />
              </div>
              <div className="input-group">
                <i className="bx bxs-lock-alt"></i>
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={onChange}
                  autoComplete="new-password"
                />
              </div>
              {/* 🔹 비밀번호 확인 */}
              <div className="input-group">
                <i className="bx bxs-lock-alt"></i>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={onChange}
                  autoComplete="new-password"
                  aria-invalid={pwMismatch}
                  aria-describedby="pw-helper"
                />
              </div>

              {/* 🔹 실시간 불일치 안내 */}
              {!isSignIn && pwMismatch && (
                <p id="pw-helper" className="error">비밀번호가 일치하지 않습니다.</p>
              )}
              {!isSignIn && !pwMismatch && error && <p className="error">{error}</p>}

              <button onClick={handleSubmit} disabled={loading || pwMismatch}>
                {loading ? 'Signing up…' : 'Sign up'}
              </button>

              <p>
                <span>Already have an account?</span>{' '}
                <b onClick={toggleMode} className="pointer">Sign in here</b>
              </p>
            </div>
          </div>
        </div>

        {/* ---------- Sign In ---------- */}
        <div className="col align-items-center flex-col sign-in">
          <div className="form-wrapper align-items-center">
            <div className="form sign-in">
              <div className="input-group">
                <i className="bx bxs-user"></i>
                <input
                  name="usernameOrEmail"
                  type="text"
                  placeholder="Username or Email"
                  value={form.usernameOrEmail}
                  onChange={onChange}
                  autoComplete="username"
                />
              </div>
              <div className="input-group">
                <i className="bx bxs-lock-alt"></i>
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={onChange}
                  autoComplete="current-password"
                />
              </div>

              {isSignIn && error && <p className="error">{error}</p>}

              <button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>

              <p>
                <b onClick={() => navigate('/forgot')} className="pointer">Forgot password?</b>
              </p>
              <p>
                <span>Don't have an account?</span>{' '}
                <b onClick={toggleMode} className="pointer">Sign up here</b>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
