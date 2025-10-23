import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Voice.css';

/* === Feedback === */
type FbLevel = 'perfect' | 'neutral' | 'needs';
type Feedback = { level: FbLevel; label: string; score: number; explain: string; suggestion: string; };

const ensurePeriod = (s: string) => s.trim().replace(/([^.?!])$/, '$1.');
const genFeedback = (t: string): Feedback => {
  const s = t.trim();
  const words = s ? s.split(/\s+/).length : 0;
  const hasPunct = /[.!?]$/.test(s);
  const dup = /\b(\w+)\b.*\b\1\b/i.test(s);
  let score = 70 + (words >= 8 ? 15 : 0) + (hasPunct ? 5 : 0) + (!dup ? 5 : 0);
  score = Math.max(40, Math.min(100, score));
  const level: FbLevel = score >= 92 ? 'perfect' : score <= 74 ? 'needs' : 'neutral';
  const label = level === 'perfect' ? '완벽한 표현' : level === 'neutral' ? '무난한 표현' : '개선 필요';
  let explain = '매우 자연스러운 문장입니다.';
  let suggestion = s;
  if (level === 'needs') {
    explain = '중복·장문·끝맺음 이슈. 핵심만 간결하게.';
    suggestion = ensurePeriod(s.replace(/\bI would go for\b/gi, "I'd choose").replace(/\s+/g, ' '));
  } else if (level === 'neutral') {
    explain = '자연스럽습니다. 의미를 더 선명하게.';
    suggestion = ensurePeriod(s.replace(/\bi would like to\b/gi, "I'd like to"));
  } else {
    suggestion = ensurePeriod(s);
  }
  return { level, label, score, explain, suggestion };
};

/* === Message === */
type Message = { id: string; role: 'ai' | 'user'; text: string; time: number; feedback?: Feedback; };
const fmtTime = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function Voice() {
  const nav = useNavigate();
  const [topic, setTopic] = useState('');
  const [started, setStarted] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState('');
  const [finalText, setFinalText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);

  const addMsg = (role: 'ai' | 'user', text: string, feedback?: Feedback) =>
    setMessages(p => [...p, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, role, text, time: Date.now(), feedback }]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // 모든 Web Speech 타입을 any로 처리
  const recogRef = useRef<any>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const lastInterimRef = useRef<string>('');

  const commitText = useCallback((text?: string) => {
    const raw = (text ?? lastInterimRef.current ?? interim).trim();
    if (!raw) return;
    setInterim('');
    lastInterimRef.current = '';
    setFinalText(prev => (prev ? `${prev} ${raw}` : raw));
    const fb = genFeedback(raw);
    addMsg('user', raw, fb);
    setTimeout(() => addMsg('ai', `AI: "${raw}"에 대한 응답 예시입니다.`), 350);
  }, [interim]);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };
  const armSilenceTimer = () => {
    clearSilenceTimer();
    silenceTimerRef.current = window.setTimeout(() => { commitText(); }, 900) as unknown as number;
  };

  /* === Init SpeechRecognition === */
  useEffect(() => {
    (async () => {
      const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SR) { setSupported(false); return; }
      try { await navigator.mediaDevices.getUserMedia({ audio: true }); }
      catch { setSupported(false); return; }

      setSupported(true);
      const r: any = new SR();
      r.continuous = true;
      r.interimResults = true;
      r.lang = 'en-US';
      recogRef.current = r;

      r.onstart = () => setRecording(true);
      r.onaudioend = () => setRecording(false);
      r.onerror = () => setRecording(false);

      r.onresult = (e: any) => {
        let iText = '', fText = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript as string;
          if (e.results[i].isFinal) fText += t;
          else iText += t;
        }
        if (iText) {
          const trimmed = iText.trim();
          lastInterimRef.current = trimmed;
          setInterim(trimmed);
          armSilenceTimer();
        }
        if (fText) {
          clearSilenceTimer();
          const clean = fText.trim();
          if (clean) commitText(clean);
          else { setInterim(''); lastInterimRef.current = ''; }
        }
      };

      r.onend = () => {
        setRecording(false);
        clearSilenceTimer();
        if (lastInterimRef.current.trim()) commitText();
      };

      return () => {
        try { r.stop(); } catch {}
        recogRef.current = null;
        clearSilenceTimer();
      };
    })();
  }, [commitText]);

  /* === Controls === */
  const start = useCallback(async () => {
    const r: any = recogRef.current;
    if (!r) return;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      if (r._starting) return;
      r._starting = true;
      setInterim('');
      lastInterimRef.current = '';
      r.start();
      setTimeout(() => { r._starting = false; }, 300);
    } catch { setSupported(false); }
  }, []);

  const stop = useCallback(() => {
    const r: any = recogRef.current;
    if (!r) return;
    if (interim.trim() || lastInterimRef.current.trim()) commitText();
    setRecording(false);
    clearSilenceTimer();
    try { r.stop(); } catch {}
  }, [commitText, interim]);

  const toggle = () => (recording ? stop() : start());

  /* === Topic === */
  const beginTopic = (t: string) => {
    setTopic(t);
    setStarted(true);
    addMsg('ai', `Let's start a voice roleplay about "${t}". Speak when you're ready!`);
  };

  /* === Exit === */
  const exit = () => {
    stop();
    const total = messages.length;
    const userTurns = messages.filter(m => m.role === 'user').length;
    const aiTurns = messages.filter(m => m.role === 'ai').length;
    const participation = userTurns / Math.max(total, 1);
    const score = Math.min(100, Math.round(70 + participation * 30));
    const t = (topic || '').toLowerCase();
    const toCategory = (): 'Grammar' | 'Vocabulary' | 'Conversation' => {
      if (t.includes('공항') || t.includes('airport')) return 'Grammar';
      if (t.includes('레스토랑') || t.includes('restaurant')) return 'Vocabulary';
      return 'Conversation';
    };
    const newFeedback = {
      topic: toCategory(),
      feedback: `세션 요약 - 주제: ${topic || 'Voice Session'} - 총 메시지: ${total} (사용자 ${userTurns}, AI ${aiTurns}) - 코멘트: 발화가 잘 인식되었어요. 문장을 더 길게 말해보면 표현이 풍부해져요.`,
      score,
      level: (score >= 90 ? 'excellent' : score >= 75 ? 'good' : 'needs-work') as 'excellent' | 'good' | 'needs-work',
      date: new Date().toISOString().slice(0, 10),
    };
    nav('/feedback', { state: { newFeedback } });
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
          {started ? (
            <button className="exit-chip" onClick={exit} aria-label="세션 종료">종료</button>
          ) : <div className="spacer" />}
        </div>

        {!started && (
          <div className="voice-topic-overlay" role="dialog" aria-modal="true">
            <div className="voice-topic-card">
              <h3>어떤 상황으로 연습할까요?</h3>
              {supported === false && (
                <div className="sr-warn">이 브라우저는 음성 인식을 지원하지 않아요. (Chrome 권장)</div>
              )}
              <div className="voice-topic-grid">
                {topics.map(x => (
                  <button key={x.label} className="voice-topic-item" onClick={() => beginTopic(x.t)}>
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

        {started && (
          <>
            <div className="voice-chat-messages" role="log" aria-live="polite">
              {messages.map(m => (
                <div key={m.id} className={`vmsg-row ${m.role}`}>
                  {m.role === 'ai' && <div className="v-avatar" aria-hidden>🤖</div>}
                  <div className={`v-bubble ${m.role}`}>
                    <div>{m.text}</div>
                    {m.role === 'user' && m.feedback && (
                      <>
                        <div className="b-sep" />
                        <div className={`bfb bfb-${m.feedback.level}`}>
                          <div className="bfb-head">
                            <span className={`bfb-dot bfb-${m.feedback.level}`} aria-hidden />
                            <span className="bfb-label">{m.feedback.label} · {m.feedback.score}/100</span>
                          </div>
                          <div className="bfb-explain">{m.feedback.explain}</div>
                          <div className="bfb-sg-title">Suggestion</div>
                          <div className="bfb-sg-text">{m.feedback.suggestion}</div>
                        </div>
                      </>
                    )}
                    <div className="v-meta">{fmtTime(m.time)}</div>
                  </div>
                  {m.role === 'user' && <div className="v-avatar" aria-hidden>🗣️</div>}
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="voice-transcript">
              <div className={`pill ${recording ? 'live' : ''}`}>{recording ? '● LIVE' : 'READY'}</div>
              <div className="transcript-text">
                {interim ? <em>{interim}</em> : (finalText ? finalText : '마이크를 켜고 말해보세요')}
              </div>
            </div>

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
              <div className="wave" aria-hidden><span/><span/><span/><span/><span/></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
