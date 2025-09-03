// src/pages/Login.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../pages/Login.css'; // 경로 맞게

type AuthResponse = {
  token?: string;
  user?: {
    id: string | number;
    username?: string;
    email?: string;
  };
  // 서버가 추가로 주는 필드 있으면 여기에 확장
};

export default function Login() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [form, setForm] = useState({
    // sign in: usernameOrEmail, password 사용
    // sign up: username, email, password 사용
    usernameOrEmail: '',
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    // 초기 애니메이션/상태 전환용 (UI 유지)
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
    });
    setIsSignIn((p) => !p);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const isEmail = (v: string) => /\S+@\S+\.\S+/.test(v);

  /** 로그인: 서버가 identifier/email/username 중 무엇을 받든 대응 */
  const loginSmart = async (identifier: string, password: string) => {
    const trimmed = identifier.trim();
    const tries: Array<Record<string, string>> = [];

    // 1) 가장 흔한 'identifier' 조합
    tries.push({ identifier: trimmed, password });

    // 2) 이메일/유저네임 분기
    if (isEmail(trimmed)) {
      tries.push({ email: trimmed, password });
      tries.push({ username: trimmed, password }); // 혹시 서버가 username만 받는 특이 케이스 방지
    } else {
      tries.push({ username: trimmed, password });
      tries.push({ email: trimmed, password });
    }

    let lastErrText = '';
    for (const payload of tries) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 쿠키 세션을 쓸 때는 아래 줄 주석 해제하고 서버 CORS 설정 필요
        // credentials: 'include',
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (res.ok) {
        const data: AuthResponse = text ? JSON.parse(text) : {};
        if (data?.token) localStorage.setItem('token', data.token);
        return data;
      }
      lastErrText = text || `HTTP ${res.status}`;
      // 400/401은 다음 스키마로 재시도, 그 외는 중단
      if (![400, 401].includes(res.status)) break;
    }
    throw new Error(lastErrText || '로그인 실패');
  };

  /** 회원가입 */
  const signup = async (username: string, email: string, password: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // credentials: 'include',
      body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
    const data: AuthResponse = text ? JSON.parse(text) : {};
    // 회원가입 후 바로 토큰을 주는 서버면 저장
    if (data?.token) localStorage.setItem('token', data.token);
    return data;
  };

  /** 제출 */
  const handleSubmit = async () => {
    setError('');

    if (isSignIn) {
      // 로그인
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
      // 회원가입
      if (!form.username.trim() || !isEmail(form.email.trim()) || !form.password) {
        setError('유효한 사용자명/이메일/비밀번호를 입력해주세요.');
        return;
      }
      setLoading(true);
      try {
        await signup(form.username, form.email, form.password);
        // UX: 회원가입 성공 → 로그인 화면으로
        setIsSignIn(true);
        // 바로 로그인까지 하고 싶으면 아래 두 줄 사용
        // await loginSmart(form.email, form.password);
        // navigate('/home');
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

              {!isSignIn && error && <p className="error">{error}</p>}

              <button onClick={handleSubmit} disabled={loading}>
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
