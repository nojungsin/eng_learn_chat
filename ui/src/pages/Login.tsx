import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../pages/Login.css';

type AuthResponse = {
    success?: boolean;
    message?: string;
    accessToken?: string; // 백엔드와 합의된 키
    token?: string;       // 혹시 기존 코드 호환
    user?: { id: number; username: string; email: string };
};


//로그인 함수
export default function Login() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [signupForm, setSignupForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  //회원가입 후 로그인 페이지로 넘어갈 때 이메일 자동 입력
  useEffect(() => {
    if (location.state?.email) {
      setLoginForm((prev) => ({ ...prev, email: location.state.email }));
      setIsSignIn(true);
    }
  }, [location.state]);

  // ---------- Input Handlers ----------
  const onChangeLogin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm((f) => ({ ...f, [name]: value }));
  };

  const onChangeSignup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupForm((f) => ({ ...f, [name]: value }));
  };

  // ---------- Validation ----------
  const emailOk = useMemo(
      () => !signupForm.email || /\S+@\S+\.\S+/.test(signupForm.email),
      [signupForm.email]
  );

  const pwMismatch = useMemo(
      () =>
          !!signupForm.password &&
          !!signupForm.confirmPassword &&
          signupForm.password !== signupForm.confirmPassword,
      [signupForm.password, signupForm.confirmPassword]
  );

  const canLogin = useMemo(
      () => !!loginForm.email.trim() && !!loginForm.password,
      [loginForm.email, loginForm.password]
  );

  const canSignup = useMemo(
      () =>
          !!signupForm.username.trim() &&
          !!signupForm.email.trim() &&
          !!signupForm.password &&
          !!signupForm.confirmPassword &&
          emailOk &&
          !pwMismatch,
      [signupForm, emailOk, pwMismatch]
  );

  // ---------- Submit Handler ----------
    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isSignIn) {
                // ===== 로그인 =====
                if (!canLogin) return;

                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: loginForm.email.trim(),
                        password: loginForm.password,
                    }),
                });

                // 응답 파싱 (빈 바디/비 JSON 방어)
                const ct = res.headers.get('content-type') || '';
                if (!ct.includes('application/json')) {
                    // ★ 여기서 바로 막아버리면 index.html 같은 비JSON 응답을 즉시 잡아냄
                    throw new Error(
                        `서버가 JSON이 아닌 응답을 반환했습니다. (content-type=${ct}) ` +
                        `API 경로/프록시 설정을 확인하세요.`
                    );
                }
                const data: any = ct.includes('application/json') ? await res.json() : {};

                //
                if (!res.ok || data.success === false) {
                    throw new Error(data?.message || `로그인 실패 (HTTP ${res.status})`);
                }

                // 백엔드 키 이름에 맞춰 저장 (accessToken 사용)
                const token: string | undefined = data.accessToken ?? data.token;
                if (!token) throw new Error('토큰이 없습니다.');

                localStorage.setItem('accessToken', token);
                navigate('/home', { replace: true });

            } else {
                // ===== 회원가입 =====
                if (!canSignup) return;

                const payload = {
                    username: signupForm.username.trim(),
                    email: signupForm.email.trim(),
                    password: signupForm.password,
                    confirmPassword: signupForm.confirmPassword,
                };

                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: signupForm.username.trim(),
                        email: signupForm.email.trim(),
                        password: signupForm.password,
                        confirmPassword: signupForm.confirmPassword,
                    }),
                });

                const ct = res.headers.get('content-type') || '';
                const data: any = ct.includes('application/json') ? await res.json() : {};

                if (!res.ok || data.success === false) {
                    throw new Error(data?.message || `회원가입 실패 (HTTP ${res.status})`);
                }

                // 회원가입 성공 → 로그인 탭으로 전환 + 이메일 자동 채움
                setIsSignIn(true);
                setLoginForm((f) => ({ ...f, email: signupForm.email.trim() }));
            }
        } catch (e: any) {
            setError(e?.message || '요청 처리 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };


    //엔터 키로 제출
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !loading) {
      if (isSignIn && canLogin) handleSubmit();
      else if (!isSignIn && canSignup) handleSubmit();
    }
  };

  // ---------- Render ----------
  return (
      <div
          className={`container ${isSignIn ? 'sign-in' : 'sign-up'}`}
          onKeyDown={handleKeyDown}
      >
        <div className="row">
          {/*회원가입 페이지*/}
          <div className="col align-items-center flex-col sign-up">
            <div className="form-wrapper align-items-center">
              <div className="form sign-up">
                <div className="input-group">
                  <input
                      name="username"
                      type="text"
                      placeholder="Username"
                      value={signupForm.username}
                      onChange={onChangeSignup}
                  />
                </div>
                <div className="input-group">
                  <input
                      name="email"
                      type="email"
                      placeholder="Email"
                      value={signupForm.email}
                      onChange={onChangeSignup}
                  />
                </div>
                {!emailOk && <p className="error">이메일 형식이 올바르지 않습니다.</p>}

                <div className="input-group">
                  <input
                      name="password"
                      type="password"
                      placeholder="Password"
                      value={signupForm.password}
                      onChange={onChangeSignup}
                  />
                </div>
                <div className="input-group">
                  <input
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={signupForm.confirmPassword}
                      onChange={onChangeSignup}
                  />
                </div>
                {pwMismatch && <p className="error">비밀번호가 일치하지 않습니다.</p>}
                {!pwMismatch && !isSignIn && error && <p className="error">{error}</p>}

                <button
                    className={`btn ${!canSignup ? 'btn-disabled' : ''}`}
                    onClick={handleSubmit}
                    disabled={!canSignup || loading}
                >
                  {loading ? 'Signing up…' : 'Sign up'}
                </button>

                <p>
                  <span>Already have an account?</span>{' '}
                  <b
                      onClick={() => {
                        setError('');
                        setIsSignIn(true);
                      }}
                      className="pointer"
                  >
                    Sign in here
                  </b>
                </p>
              </div>
            </div>
          </div>

          {/* 로그인 페이지*/}
          <div className="col align-items-center flex-col sign-in">
            <div className="form-wrapper align-items-center">
              <div className="form sign-in">
                <div className="input-group">
                  <input
                      name="email"
                      type="email"
                      placeholder="Email"
                      value={loginForm.email}
                      onChange={onChangeLogin}
                      autoComplete="email"
                  />
                </div>
                <div className="input-group">
                  <input
                      name="password"
                      type="password"
                      placeholder="Password"
                      value={loginForm.password}
                      onChange={onChangeLogin}
                  />
                </div>
                {isSignIn && error && <p className="error">{error}</p>}

                <button
                    className={`btn ${!canLogin ? 'btn-disabled' : ''}`}
                    onClick={handleSubmit}
                    disabled={!canLogin || loading}
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>

                <p>
                  <span>Don't have an account?</span>{' '}
                  <b
                      onClick={() => {
                        setError('');
                        setIsSignIn(false);
                      }}
                      className="pointer"
                  >
                    Sign up here
                  </b>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
