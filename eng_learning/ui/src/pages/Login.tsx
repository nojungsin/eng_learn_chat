import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../pages/Login.css';

type AuthResponse = {
  ok?: boolean;
  message?: string;
  token?: string;
  user?: { id: number; username: string; email: string };
};

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
  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (isSignIn) {
        if (!canLogin) return;
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({

            email: loginForm.email.trim(),
            password: loginForm.password,
          }),
        });
        const data: AuthResponse = await res.json();
        if (!res.ok) throw new Error(data?.message || '로그인 실패');
        if (data.token) localStorage.setItem('token', data.token);
        navigate('/home');
      } else {
        if (!canSignup) return;
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
        const data: AuthResponse = await res.json();
        if (!res.ok) throw new Error(data?.message || '회원가입 실패');
        if (data.token) localStorage.setItem('token', data.token);
        setIsSignIn(true); // 회원가입 완료 후 로그인 화면으로
      }
    } catch (e: any) {
      setError(e?.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Render ----------
  return (
      <div className={`container ${isSignIn ? 'sign-in' : 'sign-up'}`}>
        <div className="row">

          {/* ---------- Sign Up ---------- */}
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

                <button className="btn" onClick={handleSubmit} disabled={!canSignup || loading}>
                  {loading ? 'Signing up…' : 'Sign up'}
                </button>

                <p>
                  <span>Already have an account?</span>{' '}
                  <b onClick={() => { setError(''); setIsSignIn(true); }} className="pointer">
                    Sign in here
                  </b>
                </p>
              </div>
            </div>
          </div>

          {/* ---------- Sign In ---------- */}
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

                <button className="btn" onClick={handleSubmit} disabled={!canLogin || loading}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>

                <p>
                  <span>Don't have an account?</span>{' '}
                  <b onClick={() => { setError(''); setIsSignIn(false); }} className="pointer">
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
