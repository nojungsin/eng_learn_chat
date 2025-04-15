import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  // Conversation 버튼 클릭 시 choose.tsx로 이동
  const handleConversationClick = () => {
    navigate('/Choose'); // /choose 경로로 이동
  };

  return (
    <div className="home-container">
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

      <button className="mypage-btn" onClick={() => navigate('/mypage')}>
        👤 Mypage
      </button>
    </div>
  );
}
