import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  const handleEnterChatRoom = (roomId: string) => {
    navigate('/chat', { state: { topic: roomId } });
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h2>🏠 Welcome Back!</h2>
        <p>어떤 주제로 영어 연습을 해볼까요?</p>

        <div className="home-buttons">
          <button onClick={() => handleEnterChatRoom('grammar')}>📘 Grammar</button>
          <button onClick={() => handleEnterChatRoom('vocabulary')}>🧠 Vocabulary</button>
          <button onClick={() => handleEnterChatRoom('conversation')}>💬 Conversation</button>
          <button onClick={() => navigate('/vocab')}>📚 단어장</button>
        </div>

        <button className="logout-btn" onClick={() => navigate('/login')}>
          로그아웃
        </button>
      </div>

      <button className="mypage-btn" onClick={() => navigate('/mypage')}>
        👤 마이페이지
      </button> {/* 오른쪽 상단에 고정된 마이페이지 버튼 */}
    </div>
  );
}
