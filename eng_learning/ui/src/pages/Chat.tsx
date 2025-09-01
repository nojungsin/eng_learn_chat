import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Chat.css';

type Message = {
  id: string;
  role: 'ai' | 'user';
  content: string;
};

export default function Chat() {
  const [isTopicSelected, setIsTopicSelected] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  const endRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (role: 'ai' | 'user', content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, role, content },
    ]);
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setIsTopicSelected(true);
    // 안내 메시지는 AI가 말한 걸로 처리(왼쪽)
    addMessage('ai', `Let's start the roleplay about "${topic}". You can type your first line!`);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    // 내 메시지(오른쪽)
    addMessage('user', text);
    setInput('');

    // (옵션) 임시 AI 응답 데모 — 실제 API 연동 시 이 부분을 대체하세요.
    setTimeout(() => {
      addMessage('ai', `AI: "${text}" 에 대한 응답 예시입니다.`);
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExit = () => {
    setIsTopicSelected(false);
    setSelectedTopic('');
    setMessages([]);
    setInput('');
    navigate('/feedback');
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {isTopicSelected && (
          <button className="exit-button" onClick={handleExit}>
            ❌
          </button>
        )}

        <div className="chat-header">
          {isTopicSelected ? `💬 롤플레이 주제: ${selectedTopic}` : '💬 롤플레이 주제 선택'}
        </div>

        {!isTopicSelected && (
          <div className="topic-selection">
            <p>어떤 롤플레이를 할까요?</p>
            <button onClick={() => handleTopicSelect('병원에서 의사와 환자')}>🏥 병원</button>
            <button onClick={() => handleTopicSelect('레스토랑에서 주문하기')}>🍽️ 레스토랑</button>
            <button onClick={() => handleTopicSelect('공항에서 체크인하기')}>✈️ 공항</button>
            <button onClick={() => handleTopicSelect('호텔에서 체크인하기')}>🏨 호텔</button>
          </div>
        )}

        {isTopicSelected && (
          <>
            <div className="chat-messages">
              {messages.map((m) => (
                <div key={m.id} className={`message-row ${m.role}`}>
                  <div className={`message-bubble ${m.role}`}>
                    <span>{m.content}</span>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="chat-input-area">
              <input
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
              />
              <button className="send-button" onClick={handleSend}>
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
