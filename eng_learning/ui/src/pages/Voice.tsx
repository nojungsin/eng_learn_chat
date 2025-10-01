import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Voice.css';

type Message = { id: string; role: 'ai' | 'user'; text: string; time: number };

const fmtTime = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function Voice() {
  const nav = useNavigate();

  // Topic / UI
  const [topic, setTopic] = useState<string>('');
  const [started, setStarted] = useState(false);

  // SpeechRecognition
  const [supported, setSupported] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState('');
  const [finalText, setFinalText] = useState('');

  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);
  const addMsg = (role: 'ai' | 'user', text: string) =>
    setMessages(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, role, text, time: Date.now() }]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // SR instance
  const recogRef = useRef<any>(null);

  // Init SpeechRecognition
  useEffect(() => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const r = new SR();
    r.continuous = true;       // 계속 듣기
    r.interimResults = true;   // 중간 결과
    r.lang = 'en-US';
    recogRef.current = r;

    r.onresult = (e: any) => {
      let interimText = '';
      let finalChunk = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalChunk += transcript;
        else interimText += transcript;
      }
      if (interimText) setInterim(interimText.trim());
      if (finalChunk) {
        const clean = finalChunk.trim();
        if (clean) {
          setFinalText(prev => (prev ? `${prev} ${clean}` : clean));
          addMsg('user', clean);
          // 데모 AI 응답 (실제 API 연동 시 교체)
          setTimeout(() => addMsg('ai', `AI: "${clean}"에 대한 응답 예시입니다.`), 350);
        }
        setInterim('');
      }
    };

    r.onerror = () => setRecording(false);
    r.onend = () => setRecording(false);

    return () => {
      try { r.stop(); } catch {}
      recogRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    if (!recogRef.current) return;
    setRecording(true);
    setInterim('');
    try { recogRef.current.start(); } catch {}
  }, []);

  const stop = useCallback(() => {
    if (!recogRef.current) return;
    setRecording(false);
    try { recogRef.current.stop(); } catch {}
  }, []);

  const toggle = () => (recording ? stop() : start());

  // Topic handling
  const beginTopic = (t: string) => {
    setTopic(t);
    setStarted(true);
    addMsg('ai', `Let's start a voice roleplay about "${t}". Speak when you're ready!`);
  };

  // ✅ 종료 → 피드백 보고서 이동
  const exit = () => {
    stop(); // 녹음 중이면 정지

    // 세션 통계로 점수 계산
    const total = messages.length;
    const userTurns = messages.filter(m => m.role === 'user').length;
    const aiTurns   = messages.filter(m => m.role === 'ai').length;
    const participation = userTurns / Math.max(total, 1);
    const score = Math.min(100, Math.round(70 + participation * 30)); // 70~100

    // 토픽 → 카테고리 매핑 (한/영 모두 커버)
    const t = (topic || '').toLowerCase();
    const toCategory = (): 'Grammar' | 'Vocabulary' | 'Conversation' => {
      if (t.includes('공항') || t.includes('airport')) return 'Grammar';
      if (t.includes('레스토랑') || t.includes('restaurant')) return 'Vocabulary';
      return 'Conversation';
    };

    const newFeedback = {
      topic: toCategory(),
      feedback:
`세션 요약
- 주제: ${topic || 'Voice Session'}
- 총 메시지: ${total} (사용자 ${userTurns}, AI ${aiTurns})
- 코멘트: 발화가 잘 인식되었어요. 문장을 더 길게 말해보면 표현이 풍부해져요.`,
      score,
      level: (score >= 90 ? 'excellent' : score >= 75 ? 'good' : 'needs-work') as
        'excellent' | 'good' | 'needs-work',
      date: new Date().toISOString().slice(0, 10),
    };

    // 피드백 화면으로 이동 (Chat.tsx와 동일 패턴)
    nav('/feedback', { state: { newFeedback } });

    // (선택) 로컬 상태 초기화
    setStarted(false);
    setTopic('');
    setInterim('');
    setFinalText('');
    setMessages([]);
  };

  const topics = [
    { emoji: '🏥', label: '병원', t: 'Visiting a doctor at the hospital' },
    { emoji: '🍽️', label: '레스토랑', t: 'Ordering food at a restaurant' },
    { emoji: '✈️', label: '공항', t: 'Check-in and boarding at the airport' },
    { emoji: '🏨', label: '호텔', t: 'Checking in at a hotel' },
  ];

  return (
    <div className="voice-chat-container">
      <div className="voice-chat-box">
        <div className="voice-topbar">
          <button className="back-btn" onClick={() => nav('/home')} aria-label="뒤로가기">←</button>
          <div className="voice-chat-header">
            {started ? `🎤 음성 롤플레이: ${topic}` : '🎤 음성 채팅 시작하기'}
          </div>
          {/* 오른쪽 칼럼: 세션 중이면 종료 버튼, 아니면 공간 맞춤용 스페이서 */}
          {started ? (
            <button className="exit-chip" onClick={exit} aria-label="세션 종료">종료</button>
          ) : (
            <div className="spacer" />
          )}
        </div>

        {/* Topic selection */}
        {!started && (
          <div className="voice-topic-overlay" role="dialog" aria-modal="true">
            <div className="voice-topic-card">
              <h3>어떤 상황으로 연습할까요?</h3>
              {supported === false && (
                <div className="sr-warn">이 브라우저는 음성 인식을 지원하지 않아요. (Chrome 권장)</div>
              )}
              <div className="voice-topic-grid">
                {topics.map(x => (
                  <button
                    key={x.label}
                    className="voice-topic-item"
                    onClick={() => beginTopic(x.t)}
                  >
                    <span className="voice-topic-emoji" aria-hidden>{x.emoji}</span>
                    <div className="voice-topic-main">
                      <div className="voice-topic-title">{x.label}</div>
                      <div className="voice-topic-desc">{x.t}</div>
                    </div>
                    {/* 폰트 호환을 위해 단순 화살표 사용 */}
                    <span className="voice-topic-chevron" aria-hidden>→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {started && (
          <>
            <div className="voice-chat-messages" role="log" aria-live="polite">
              {messages.map(m => (
                <div key={m.id} className={`vmsg-row ${m.role}`}>
                  {m.role === 'ai' && <div className="v-avatar" aria-hidden>🤖</div>}
                  <div className={`v-bubble ${m.role}`}>
                    <div>{m.text}</div>
                    <div className="v-meta">{fmtTime(m.time)}</div>
                  </div>
                  {m.role === 'user' && <div className="v-avatar" aria-hidden>🗣️</div>}
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* Live transcript */}
            <div className="voice-transcript">
              <div className={`pill ${recording ? 'live' : ''}`}>
                {recording ? '● LIVE' : 'READY'}
              </div>
              <div className="transcript-text">
                {interim ? <em>{interim}</em> : (finalText ? finalText : '마이크를 켜고 말해보세요')}
              </div>
            </div>

            {/* Controls */}
            <div className="voice-controls">
              <button
                className={`mic-btn ${recording ? 'active' : ''}`}
                onClick={toggle}
                disabled={supported === false}
                aria-pressed={recording}
                aria-label={recording ? '녹음 중지' : '녹음 시작'}
              >
                <span className="mic-icon" aria-hidden>🎙️</span>
              </button>

              <div className="wave" aria-hidden>
                <span/><span/><span/><span/><span/>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
