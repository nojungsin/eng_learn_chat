import { useNavigate } from 'react-router-dom';
import './Mypage.css';

export default function Mypage() {
  const navigate = useNavigate();
  const go = (to: string) => () => navigate(to);
  const onKeyActivate =
    (to: string) =>
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(to);
      }
    };

  return (
    <div className="mypage-container">
      <div className="profile-header">
        <div className="profile-avatar" aria-hidden>👤</div>
        <div className="profile-info">
          <h2>로그인하세요</h2>
          <p>당신의 페이지를 보세요.</p>
        </div>
        <button onClick={go('/login')} className="login-btn" aria-label="회원가입 또는 로그인">
          회원가입/로그인
        </button>
      </div>

      <div className="menu-list" role="menu" aria-label="마이페이지 메뉴">
        <div
          className="menu-item"
          role="menuitem"
          tabIndex={0}
          onClick={go('/feedback')}
          onKeyDown={onKeyActivate('/feedback')}
        >
          <span className="menu-icon">📋</span>
          <div className="menu-texts">
            <span className="menu-text">학습 지표</span>
            <span className="menu-sub">나의 피드백/점수 모아보기</span>
          </div>
          <span className="menu-chevron" aria-hidden>›</span>
        </div>

        <div
          className="menu-item"
          role="menuitem"
          tabIndex={0}
          onClick={go('/service')}
          onKeyDown={onKeyActivate('/service')}
        >
          <span className="menu-icon">📞</span>
          <div className="menu-texts">
            <span className="menu-text">Customer service</span>
            <span className="menu-sub">문의/도움 받기</span>
          </div>
          <span className="menu-chevron" aria-hidden>›</span>
        </div>

        <div
          className="menu-item"
          role="menuitem"
          tabIndex={0}
          onClick={go('/feedback')}
          onKeyDown={onKeyActivate('/feedback')}
        >
          <span className="menu-icon">📝</span>
          <div className="menu-texts">
            <span className="menu-text">Suggested feedback</span>
            <span className="menu-sub">추천 코멘트 확인</span>
          </div>
          <span className="menu-chevron" aria-hidden>›</span>
        </div>

        <div
          className="menu-item"
          role="menuitem"
          tabIndex={0}
          onClick={go('/personal-data')}
          onKeyDown={onKeyActivate('/personal-data')}
        >
          <span className="menu-icon">🔐</span>
          <div className="menu-texts">
            <span className="menu-text">Personal data</span>
            <span className="menu-sub">내 정보 관리</span>
          </div>
          <span className="menu-chevron" aria-hidden>›</span>
        </div>

        <div
          className="menu-item"
          role="menuitem"
          tabIndex={0}
          onClick={go('/announcements')}
          onKeyDown={onKeyActivate('/announcements')}
        >
          <span className="menu-icon">📢</span>
          <div className="menu-texts">
            <span className="menu-text">공지사항</span>
            <span className="menu-sub">업데이트/알림</span>
          </div>
          <span className="menu-chevron" aria-hidden>›</span>
        </div>

        <div
          className="menu-item"
          role="menuitem"
          tabIndex={0}
          onClick={go('/faq')}
          onKeyDown={onKeyActivate('/faq')}
        >
          <span className="menu-icon">❓</span>
          <div className="menu-texts">
            <span className="menu-text">FAQ</span>
            <span className="menu-sub">자주 묻는 질문</span>
          </div>
          <span className="menu-chevron" aria-hidden>›</span>
        </div>
      </div>
    </div>
  );
}
