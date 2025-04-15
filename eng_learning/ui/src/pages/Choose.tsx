import { useNavigate } from 'react-router-dom';
import './Choose.css';

export default function Choose() {
  const navigate = useNavigate();

  const handleSelectMode = (mode: string) => {
    if (mode === 'text') {
      navigate('/text'); // 텍스트 채팅 화면으로 이동
    } else if (mode === 'voice') {
      navigate('/voice'); // 음성 채팅 화면으로 이동
    }
  };

  return (
    <div className="choose-container">
      <div className="choose-card">
        <h2>💬 채팅 모드를 선택하세요</h2>
        <button onClick={() => handleSelectMode('text')}>💬 텍스트 채팅</button>
        <button onClick={() => handleSelectMode('voice')}>🎤 음성 채팅</button>
      </div>
    </div>
  );
}
