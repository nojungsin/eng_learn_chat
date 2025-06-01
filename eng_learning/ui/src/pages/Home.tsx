import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  const handleConversationClick = () => {
    navigate('/Choose');
  };

  return (
      <div className="home-container">
        {/* 마이페이지 버튼을 container 맨 위에 배치 */}
        <button className="mypage-icon-btn" onClick={() => navigate('/mypage')}>
          <span className="icon-menu">≡</span>
        </button>

        <div className="home-card">
          <h2>🏠 Welcome Back!</h2>
          <p>어떤 주제로 영어 연습을 해볼까요?</p>

          <div className="home-buttons">
            <button onClick={() => navigate('/test')}>🧠 Test</button>
            <button onClick={() => navigate('/vocab')}>📚 Vocabulary</button>
            <button onClick={handleConversationClick}>💬 Conversation</button>
            <button onClick={() => navigate('/feedback')}>📘 Feedback</button>
          </div>

          <button className="logout-btn" onClick={() => navigate('/login')}>
            로그아웃
          </button>
        </div>
      </div>
  );
}