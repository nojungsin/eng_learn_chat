import { useNavigate } from 'react-router-dom';
import './Mypage.css';
import {useEffect, useState} from "react";

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

  //화면에 띄울 사용자 정보들
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    // 브라우저 환경 체크(SSR 대비)
    if (typeof window === 'undefined') return;

    const t = localStorage.getItem('token');
    if (!t) return; // 비로그인 상태면 그냥 종료

    (async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (!res.ok) throw new Error('me 요청 실패');

        const me = await res.json();
        setUsername(me.username ?? '');
        setEmail(me.email ?? '');

        // 원하면 로컬스토리지에도 저장
        //localStorage.setItem('username', me.username ?? '');
        //localStorage.setItem('email', me.email ?? '');
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return (
    <div className="mypage-container">
      <div className="profile-header">
        <div className="profile-avatar" aria-hidden>👤</div>
        <div className="profile-info">
          <h2>{`${username}`}</h2>
          <p>{`${email}`}</p>
        </div>
        <button onClick={go('/home')} className="login-btn" aria-label="회원가입 또는 로그인">
        🏠 Home
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
          onClick={go('/personaldata')}
          onKeyDown={onKeyActivate('/personaldata')}
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
