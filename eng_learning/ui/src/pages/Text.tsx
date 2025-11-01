import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Chat.css';

type FbLevel = 'perfect' | 'neutral' | 'needs';
type Feedback = {
  level: FbLevel;
  label: string;
  score: number;
  explain: string;
  suggestion: string;
  original: string;
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

  const label = level === 'perfect' ? '완벽한 표현' : level === 'neutral' ? '무난한 표현' : '개선 필요';

  let explain = '매우 자연스러운 문장입니다.';
  let suggestion = t;
  if (level === 'needs') {
    explain = '중복·장문·끝맺음 문제로 어색할 수 있어요. 핵심만 간결하게.';
    suggestion = t.replace(/\bI would go for\b/gi, "I'd choose").replace(/\s+/g, ' ').replace(/[^.!?]$/, '$&.');
  } else if (level === 'neutral') {
    explain = '자연스럽습니다. 의미를 더 선명하게 다듬어보세요.';
    suggestion = t.replace(/\bi would like to\b/gi, "I'd like to").replace(/[^.!?]$/, '$&.');
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
    addMessage('ai', `Let's start a voice roleplay about "${topic}". Type when you're ready!`);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    // 사용자 메시지 우선 추가
    const msgId = `${Date.now()}-${Math.random()}`;
    const userMsg: Message = {
      id: msgId,
      role: 'user',
      content: text,
      time: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      // FastAPI 호출
      const res = await fetch('http://localhost:8000/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          ai_role: 'doctor',   // 나중에 역할 선택 추가 가능
          user_role: 'patient',
          message: text,
        }),
      });

      if (!res.ok) throw new Error('AI 서버 응답 실패');
      const data = await res.json();

      //Gemini 응답 두 가지 (사용자에게 응답 / 피드백)
      const aiText = data.reply;
      const replyMatch = aiText.match(/\[AI Reply\]:(.*?)(?=\[Feedback\]|$)/s);
      const feedbackMatch = aiText.match(/\[Feedback\]:(.*)/s);

      const aiReply = replyMatch ? replyMatch[1].trim() : aiText.trim();
      const feedbackText = feedbackMatch ? feedbackMatch[1].trim() : '';

      // 왼쪽 AI 메시지 추가
      addMessage('ai', aiReply);

      // 오른쪽 내 메시지 피드백 업데이트
      if (feedbackText) {
        setMessages(prev => prev.map(m =>
            m.id === msgId
                ? {
                  ...m,
                  feedback: {
                    level: 'neutral',
                    label: 'AI Feedback',
                    score: 0,
                    explain: feedbackText,
                    suggestion: '',
                    original: text,
                  },
                }
                : m
        ));
      }

    } catch (err) {
      console.error(err);
      addMessage('ai', '⚠️ AI 서버와의 통신에 실패했습니다.');
    }
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
      level: (score >= 90 ? 'excellent' : score >= 75 ? 'good' : 'needs-work') as 'excellent' | 'good' | 'needs-work',
      date: new Date().toISOString().slice(0, 10),
    };

    navigate('/feedback', { state: { newFeedback } });
    setIsTopicSelected(false);
    setSelectedTopic('');
    setMessages([]);
    setInput('');
  };

  // Voice와 동일한 토픽 데이터
  const topics = [
    { emoji: '🏥', label: '병원', t: 'Visiting a doctor at the hospital' },
    { emoji: '🍽️', label: '레스토랑', t: 'Ordering food at a restaurant' },
    { emoji: '✈️', label: '공항', t: 'Check-in and boarding at the airport' },
    { emoji: '🏨', label: '호텔', t: 'Checking in at a hotel' },
  ];

  return (
    <div className="chat-container">
      <div className="chat-box">
        {isTopicSelected && (
          <button className="exit-button" onClick={handleExit} aria-label="세션 종료">종료</button>
        )}

        <div className="voice-topbar">
          <button className="back-btn" onClick={() => navigate('/home')} aria-label="뒤로가기">←</button>
          <div className="voice-chat-header">
            {isTopicSelected ? `💬 롤플레이 주제: ${selectedTopic}` : '💬 롤플레이 주제 선택'}
          </div>
          {isTopicSelected ? (
            <button className="exit-chip" onClick={handleExit} aria-label="세션 종료">종료</button>
          ) : <div className="spacer" />}
        </div>


        {!isTopicSelected && (
          <div className="voice-topic-overlay" role="dialog" aria-modal="true">
            <div className="voice-topic-card">
              <h3>어떤 상황으로 연습할까요?</h3>
              <div className="voice-topic-grid">
                {[
                  { emoji:'🏥', label:'병원', t:'Visiting a doctor at the hospital' },
                  { emoji:'🍽️', label:'레스토랑', t:'Ordering food at a restaurant' },
                  { emoji:'✈️', label:'공항', t:'Check-in and boarding at the airport' },
                  { emoji:'🏨', label:'호텔', t:'Checking in at a hotel' },
                ].map(x => (
                  <button
                    key={x.label}
                    className="voice-topic-item"
                    onClick={() => handleTopicSelect(x.t)}
                    aria-label={`${x.label} 주제 시작`}
                  >
                    <span className="voice-topic-emoji" aria-hidden>{x.emoji}</span>
                    <div className="voice-topic-main">
                      <div className="voice-topic-title">{x.label}</div>
                      <div className="voice-topic-desc">{x.t}</div>
                    </div>
                    <span className="voice-topic-chevron" aria-hidden>→</span>
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
                        <div className="b-sep" />
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
