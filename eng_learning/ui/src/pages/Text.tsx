import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Chat.css';

export default function Chat() {
  const [isTopicSelected, setIsTopicSelected] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const navigate = useNavigate();

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setIsTopicSelected(true);
    setMessages([`You selected: ${topic}`]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, `🧑: ${input}`];
    setMessages(newMessages);
    setInput('');

    try {
      const response = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          userMessage: input,
        }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, `🤖: ${data.reply}`]);
    } catch (err) {
      console.error('Error communicating with Gemini API:', err);
      setMessages((prev) => [...prev, '❌ Gemini 응답 오류가 발생했습니다.']);
    }
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
                  {messages.map((msg, idx) => (
                      <div key={idx} className="message">
                        <span>{msg}</span>
                      </div>
                  ))}
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