import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Home.css';// ✅ CSS 추가

export default function Home() {
  const navigate = useNavigate();
  const [isSelecting, setIsSelecting] = useState(false); // 선택 화면을 표시할지 여부

  // Conversation 버튼 클릭 시, 텍스트 채팅 또는 음성 채팅 선택 화면을 표시
  const handleConversationClick = () => {
    setIsSelecting(true);
  };

  // 선택된 채팅 모드에 따라 Chat.tsx로 이동
  const handleModeSelect = (mode: string) => {
    setIsSelecting(false); // 선택 화면 숨기기
    navigate('/chat', { state: { mode } }); // 선택한 모드에 따라 이동
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
          <button onClick={() => navigate('/feedback')}>📘 Feedback</button> {/* ✅ 피드백 버튼 경로 수정 */}
        </div>

        <button className="logout-btn" onClick={() => navigate('/login')}>
          로그아웃
        </button>
      </div>

      <button className="mypage-btn" onClick={() => navigate('/mypage')}>
        👤 Mypage
      </button> {/* 오른쪽 상단에 고정된 마이페이지 버튼 */}

      {/* 채팅 모드 선택 화면 */}
      {isSelecting && (
        <div className="chat-mode-selection">
          <button onClick={() => handleModeSelect('text')}>💬 텍스트 채팅</button>
          <button onClick={() => handleModeSelect('voice')}>🎤 음성 채팅</button>
        </div>
      )}
    </div>
  );
}
