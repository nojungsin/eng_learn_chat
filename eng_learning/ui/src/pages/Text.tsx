import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Text.css';

type ChatRole = 'user' | 'ai';
type ChatMessage = {
  role: ChatRole;
  text: string;
};

export default function TextChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: input,
    };
    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        role: 'ai',
        text: `AI의 응답: "${input}"`,
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1000);

    setInput('');
  };

  // 종료 버튼 클릭 시 홈 화면으로 이동
  const handleEndChat = () => {
    navigate('/home'); // 홈 화면으로 이동
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        <div className="chat-header">💬 텍스트 채팅</div>

        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}-message`}>
              <span>{msg.text}</span>
            </div>
          ))}
        </div>

        <div className="chat-input-area">
          <input
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type here..."
          />
          <button className="send-button" onClick={handleSend}>
            Send
          </button>
        </div>
        
        {/* 종료 버튼 */}
        <button className="exit-button" onClick={handleEndChat}>🚪</button>
      </div>
    </div>
  );
}
