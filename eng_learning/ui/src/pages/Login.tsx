import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../pages/Login.css'; // ✅ CSS 파일 불러오기

export default function Login() {
  const [isSignIn, setIsSignIn] = useState(true);
  const navigate = useNavigate(); // ✅ React Router 훅 추가

  useEffect(() => {
    setTimeout(() => {
      setIsSignIn(true);
    }, 200);
  }, []);

  const toggleMode = () => {
    setIsSignIn((prev) => !prev);
  };

  const handleLogin = () => {
    // ✅ 로그인 버튼 클릭 시 홈으로 이동
    navigate('/home');
  };

  return (
    <div id="container" className={`container ${isSignIn ? 'sign-in' : 'sign-up'}`}>
      <div className="row">
        <div className="col align-items-center flex-col sign-up">
          <div className="form-wrapper align-items-center">
            <div className="form sign-up">
              <div className="input-group">
                <i className="bx bxs-user"></i>
                <input type="text" placeholder="Username" />
              </div>
              <div className="input-group">
                <i className="bx bx-mail-send"></i>
                <input type="email" placeholder="Email" />
              </div>
              <div className="input-group">
                <i className="bx bxs-lock-alt"></i>
                <input type="password" placeholder="Password" />
              </div>
              <button onClick={handleLogin}>Sign up</button>
              <p>
                <span>Already have an account?</span>
                <b onClick={toggleMode} className="pointer">Sign in here</b>
              </p>
            </div>
          </div>
        </div>

        <div className="col align-items-center flex-col sign-in">
          <div className="form-wrapper align-items-center">
            <div className="form sign-in">
              <div className="input-group">
                <i className="bx bxs-user"></i>
                <input type="text" placeholder="Username" />
              </div>
              <div className="input-group">
                <i className="bx bxs-lock-alt"></i>
                <input type="password" placeholder="Password" />
              </div>
              <button onClick={handleLogin}>Sign in</button> {/* ✅ 로그인 후 이동 */}
              <p><b onClick={() => navigate('/forgot')} className="pointer">Forgot password?</b>
              </p>
              <p>
                <span>Don't have an account?</span>
                <b onClick={toggleMode} className="pointer">Sign up here</b>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
