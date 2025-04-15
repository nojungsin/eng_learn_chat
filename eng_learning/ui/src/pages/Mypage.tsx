import { useNavigate } from 'react-router-dom';
import './Mypage.css';

export default function Mypage() {
  const navigate = useNavigate();

  return (
    <div className="mypage-container">
      <div className="profile-header">
        <div className="profile-info">
          <h2>로그인하세요</h2>
          <p>당신의 페이지를 보세요.</p>
        </div>
        <button onClick={() => navigate('/login')} className="login-btn">회원가입/로그인</button>
      </div>

      <div className="menu-list">
      <div className="menu-item" onClick={() => navigate('/my-feedback')}>
          <span className="menu-icon">📋</span>
          <span className="menu-text">학습 지표</span>
        </div>
        <div className="menu-item" onClick={() => navigate('/service')}>
          <span className="menu-icon">📞</span>
          <span className="menu-text">Customer service</span>
        </div>
        <div className="menu-item" onClick={() => navigate('/feedback')}>
          <span className="menu-icon">📝</span>
          <span className="menu-text">Suggested feedback</span>
        </div>
        <div className="menu-item" onClick={() => navigate('/personal-data')}>
          <span className="menu-icon">🔐</span>
          <span className="menu-text">Personal data</span>
        </div>
        <div className="menu-item" onClick={() => navigate('/announcements')}>
          <span className="menu-icon">📢</span>
          <span className="menu-text">공지사항</span>
        </div>
        <div className="menu-item" onClick={() => navigate('/faq')}>
          <span className="menu-icon">❓</span>
          <span className="menu-text">FAQ</span>
        </div>
        
      </div>
    </div>
  );
}
