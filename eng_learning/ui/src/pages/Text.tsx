import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Chat.css';

type FbLevel = 'perfect' | 'neutral' | 'needs';
type Feedback = {
  level: FbLevel;          // 등급
  label: string;           // 완벽한 표현 / 무난한 표현 / 개선 필요
  score: number;           // 0~100
  explain: string;         // 한국어 설명
  suggestion: string;      // 한 줄 제안(영문)
  original: string; // 원문(사용자 입력)
};

type Message = {
  id: string;
  role: 'ai' | 'user';
  content: string;
  time: number;
  feedback?: Feedback;
};

const fmtTime = (ts: number) => {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const genFeedback = (text: string): Feedback => {
  const t = text.trim();
  const words = t ? t.split(/\s+/).length : 0;
  const hasPunct = /[.!?]$/.test(t);
  const hasDupWord = /\b(\w+)\b.*\b\1\b/i.test(t);

  let score = 70;
  if (words >= 8) score += 15;
  if (hasPunct) score += 5;
  if (!hasDupWord) score += 5;
  score = Math.max(40, Math.min(100, score));

  let level: FbLevel = 'neutral';
  if (score >= 92) level = 'perfect';
  else if (score <= 74) level = 'needs';

  const label =
    level === 'perfect' ? '완벽한 표현' :
    level === 'neutral' ? '무난한 표현' : '개선 필요';

  let explain = '매우 자연스러운 문장입니다.';
  let suggestion = t;
  if (level === 'needs') {
    explain = '중복·장문·끝맺음 문제로 어색할 수 있어요. 핵심만 간결하게.';
    suggestion = t
      .replace(/\bI would go for\b/gi, "I'd choose")
      .replace(/\s+/g, ' ')
      .replace(/[^.!?]$/, '$&.');
  } else if (level === 'neutral') {
    explain = '자연스럽습니다. 의미를 더 선명하게 다듬어보세요.';
    suggestion = t
      .replace(/\bi would like to\b/gi, "I'd like to")
      .replace(/[^.!?]$/, '$&.');
  }

  return { level, label, score, explain, suggestion, original: t };
};

export default function Chat() {
  const [isTopicSelected, setIsTopicSelected] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  const endRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const addMessage = (role: 'ai' | 'user', content: string) => {
    setMessages(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, role, content, time: Date.now() }]);
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setIsTopicSelected(true);
    addMessage('ai', `Let's start the roleplay about "${topic}". You can type your first line!`);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const feedback = genFeedback(text);
    const msg: Message = {
      id: `${Date.now()}-${Math.random()}`,
      role: 'user',
      content: text,
      time: Date.now(),
      feedback,
    };
    setMessages(prev => [...prev, msg]);
    setInput('');

    setTimeout(() => {
      addMessage('ai', `AI: "${text}" 에 대한 응답 예시입니다.`);
    }, 350);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
  };

  const handleExit = () => {
    const topic = selectedTopic || 'General';
    const total = messages.length;
    const userTurns = messages.filter(m => m.role === 'user').length;
    const aiTurns = messages.filter(m => m.role === 'ai').length;
    const participation = userTurns / Math.max(total, 1);
    const score = Math.min(100, Math.round(70 + participation * 30));

    const newFeedback = {
      topic: (topic.includes('병원') && 'Conversation')
          || (topic.includes('레스토랑') && 'Vocabulary')
          || (topic.includes('공항') && 'Grammar')
          || (topic.includes('호텔') && 'Conversation')
          || 'Conversation',
      feedback: `세션 요약:
- 주제: ${topic}
- 총 메시지: ${total} (사용자 ${userTurns}, AI ${aiTurns})
- 코멘트: 표현은 자연스러웠습니다. 구체 예문을 더 써보면 좋아요.`,
      score,
      level: (score >= 90 ? 'excellent' : score >= 75 ? 'good' : 'needs-work') as
        'excellent' | 'good' | 'needs-work',
      date: new Date().toISOString().slice(0, 10),
    };

    navigate('/feedback', { state: { newFeedback } });
    setIsTopicSelected(false);
    setSelectedTopic('');
    setMessages([]);
    setInput('');
  };

  const topicButtons = [
    { emoji:'🏥', label:'병원', topic:'병원에서 의사와 환자' },
    { emoji:'🍽️', label:'레스토랑', topic:'레스토랑에서 주문하기' },
    { emoji:'✈️', label:'공항', topic:'공항에서 체크인하기' },
    { emoji:'🏨', label:'호텔', topic:'호텔에서 체크인하기' },
  ];

  return (
    <div className="chat-container">
      <div className="chat-box">
        {isTopicSelected && (
          <button className="exit-button" onClick={handleExit} aria-label="세션 종료">
            종료
          </button>
        )}

        <div className="chat-header">
          {isTopicSelected ? `💬 롤플레이 주제: ${selectedTopic}` : '💬 롤플레이 주제 선택'}
        </div>

        {!isTopicSelected && (
          <div className="topic-selection" role="dialog" aria-modal="true" aria-label="토픽 선택">
            <div className="topic-card">
              <h3>어떤 롤플레이를 할까요?</h3>
              <div className="topic-grid">
                {topicButtons.map(btn => (
                  <button
                    key={btn.label}
                    className="topic-btn"
                    onClick={() => handleTopicSelect(btn.topic)}
                    aria-label={`${btn.label} 주제 시작`}
                  >
                    <span className="topic-emoji" aria-hidden>{btn.emoji}</span>
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {isTopicSelected && (
          <>
            <div className="chat-messages" role="log" aria-live="polite">
              {messages.map(m => (
                <div key={m.id} className={`message-row ${m.role}`}>
                  {m.role === 'ai' && <div className="avatar" aria-hidden>🤖</div>}

                  <div className={`message-bubble ${m.role}`}>
                    <span>{m.content}</span>

                    {m.role === 'user' && m.feedback && (
                      <>
                        <div className="b-sep" /> {/* --- 구분선 --- */}
                        <div className={`bfb bfb-${m.feedback.level}`}>
                          <div className="bfb-head">
                            <span className={`bfb-dot bfb-${m.feedback.level}`} aria-hidden />
                            <span className="bfb-label">
                              {m.feedback.label} · {m.feedback.score}/100
                            </span>
                          </div>
                          <div className="bfb-explain">{m.feedback.explain}</div>
                          <div className="bfb-sg-title">Suggestion</div>
                          <div className="bfb-sg-text">{m.feedback.suggestion}</div>
                        </div>
                      </>
                    )}

                    <div className="meta">{fmtTime(m.time)}</div>
                  </div>


                  {m.role === 'user' && <div className="avatar" aria-hidden>😊</div>}
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
                aria-label="메시지 입력"
              />
              <button className="send-button" onClick={handleSend} disabled={!input.trim()}>
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
