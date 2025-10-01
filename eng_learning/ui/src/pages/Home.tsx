import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const go = (to: string) => () => navigate(to);
  const onKeyActivate =
    (to: string) =>
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(to);
      }
    };

  return (
    <div className="home-container">
      {/* 우상단 마이페이지 아이콘 */}
      <button
        className="mypage-icon-btn"
        onClick={go('/mypage')}
        onKeyDown={onKeyActivate('/mypage')}
        aria-label="마이페이지로 이동"
      >
        <span className="icon-menu">≡</span>
      </button>

      <div className="home-card">
        <header className="home-header">
          <h2>🏠 Welcome back!</h2>
          <p>오늘은 어떤 방식으로 영어를 연습할까요?</p>
        </header>

        {/* 2×2 액션 그리드 */}
        <div className="home-actions" role="group" aria-label="학습 빠른 실행">
          <button
            className="action"
            onClick={go('/test')}
            onKeyDown={onKeyActivate('/test')}
            aria-label="테스트로 이동"
          >
            <span className="action-emoji" aria-hidden>🧠</span>
            <span className="action-title">Test</span>
            <span className="action-sub">레벨 체크</span>
          </button>

          <button
            className="action"
            onClick={go('/vocab')}
            onKeyDown={onKeyActivate('/vocab')}
            aria-label="단어장으로 이동"
          >
            <span className="action-emoji" aria-hidden>📚</span>
            <span className="action-title">Vocabulary</span>
            <span className="action-sub">단어 학습</span>
          </button>

          <button
            className="action"
            onClick={go('/Choose')}
            onKeyDown={onKeyActivate('/Choose')}
            aria-label="대화 주제 선택으로 이동"
          >
            <span className="action-emoji" aria-hidden>💬</span>
            <span className="action-title">Conversation</span>
            <span className="action-sub">주제별 대화</span>
          </button>

          <button
            className="action"
            onClick={go('/feedback')}
            onKeyDown={onKeyActivate('/feedback')}
            aria-label="피드백으로 이동"
          >
            <span className="action-emoji" aria-hidden>📘</span>
            <span className="action-title">Feedback</span>
            <span className="action-sub">코멘트 확인</span>
          </button>
        </div>

        <div className="home-footer">
          <button
            className="logout-btn"
            onClick={go('/login')}
            onKeyDown={onKeyActivate('/login')}
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
