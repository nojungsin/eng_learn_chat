// Voice.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Voice.css';
// stopAndRecognize() 함수의 맨 처음 부분 위쪽 어딘가에 추가
let userText: string | null = null;
let aiText: string | null = null;

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
    } else suggestion = ensurePeriod(s);
    return { level, label, score, explain, suggestion };
};

/* === Message === */
type Message = { id: string; role: 'ai' | 'user'; text: string; time: number; feedback?: Feedback };
const fmtTime = (ts: number) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function Voice() {
    const nav = useNavigate();
    const [topic, setTopic] = useState('');
    const [started, setStarted] = useState(false);

    // 토큰 (localStorage에서 자동 조회)
    const token = (() => {
        try { return localStorage.getItem('accessToken') || ''; } catch { return ''; }
    })();

    // 브라우저 지원/권한
    const [supported, setSupported] = useState<boolean | null>(null);
    const [recording, setRecording] = useState(false);
    const [processing, setProcessing] = useState(false); // STT/AI/TTS/저장 처리 중

    // 세션
    const [sessionId, setSessionId] = useState<string | null>(null);

    // 녹음기/버퍼
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const lastBlobRef = useRef<Blob | null>(null);

    // 대화 메시지
    const [messages, setMessages] = useState<Message[]>([]);
    const endRef = useRef<HTMLDivElement | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const addMsg = (role: 'ai' | 'user', text: string, feedback?: Feedback) =>
        setMessages(p => [...p, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, role, text, time: Date.now(), feedback }]);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    /* === 지원 체크 === */
    useEffect(() => {
        const ok = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
        setSupported(ok);
    }, []);

    /* === 세션 시작 === */
    const ensureSession = useCallback(async (): Promise<string> => {
        if (sessionId) return sessionId;
        const r = await fetch('/api/voice/session/start', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        const j = await r.json();
        setSessionId(j.sessionId);
        return j.sessionId as string;
    }, [sessionId, token]);

    /* === MediaRecorder 초기화 === */
    const ensureRecorder = useCallback(async () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') return;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const preferred = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
        let mimeType = '';
        for (const m of preferred) {
            if ((window as any).MediaRecorder?.isTypeSupported?.(m)) { mimeType = m; break; }
        }
        const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
        mr.onstart = () => { chunksRef.current = []; setRecording(true); };
        mr.onstop  = () => { setRecording(false); };
        mediaRecorderRef.current = mr;
    }, []);

    const start = useCallback(async () => {
        if (supported === false) return;
        setProcessing(true);
        await ensureSession();
        await ensureRecorder();
        mediaRecorderRef.current?.start();
        setProcessing(false);
    }, [ensureRecorder, ensureSession, supported]);

    const stopAndGetBlob = useCallback(async (): Promise<Blob | null> => {
        const mr = mediaRecorderRef.current;
        if (!mr) return null;
        if (mr.state === 'inactive') return lastBlobRef.current;
        return new Promise((resolve) => {
            const onStop = () => {
                mr.removeEventListener('stop', onStop as any);
                const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
                lastBlobRef.current = blob;
                // 트랙 해제
                try { (mr as any).stream?.getTracks?.().forEach((t: MediaStreamTrack) => t.stop()); } catch {}
                resolve(blob);
            };
            mr.addEventListener('stop', onStop as any);
            mr.stop();
        });
    }, []);

    /* === 한 턴 처리: stop → (서버) chunk → finalize === */
    const stopAndRecognize = useCallback(async () => {
        try {
            setProcessing(true);
            const blob = await stopAndGetBlob();
            if (!blob) return;

            const sid = await ensureSession();

            // 1) 세션 청크 업로드(서버가 STT→AI→TTS까지 처리)
            const fd = new FormData();
            fd.append('sessionId', sid);
            fd.append('topic', topic || 'free');
            fd.append('ai_role', 'doctor');     // 필요 시 상태/프롭으로 치환
            fd.append('user_role', 'patient');  // 필요 시 상태/프롭으로 치환
            fd.append('audio', blob, 'speech.webm');

            const res = await fetch('/api/voice/session/chunk', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd, // sessionId, topic, ai_role, user_role, audio
            });
            const j = await res.json(); // j.reply, j.score, j.grammar, j.vocabulary, j.suggestion, (선택) j.user_text, j.tts_path// 사용자 음성의 텍스트가 서버에서 안 오면, STT 결과를 따로 받아 두어야 함.
            userText = (j.user_text || '').trim();
            aiText = (j.reply || '').trim();

            if (aiText) addMsg('ai', aiText);

            const score = typeof j.score === 'number' ? j.score : 80;
            const lvl: FbLevel = score >= 92 ? 'perfect' : score <= 74 ? 'needs' : 'neutral';
            const fb: Feedback = {
                level: lvl,
                label: lvl === 'perfect' ? '완벽한 표현' : lvl === 'neutral' ? '무난한 표현' : '개선 필요',
                score,
                explain: j.grammar || j.vocabulary ? `${j.grammar} ${j.vocabulary}`.trim() : '자연스러운 표현이에요.',
                suggestion: j.suggestion || '',
            };


            // 2) TTS 재생
            if (j.tts_path && audioRef.current) {
                audioRef.current.src = j.tts_path;
                try { await audioRef.current.play(); } catch {}
            }

            // 사용: ② 저장/리포트 생성
            const finRes = await fetch('/api/voice/session/finalize', {
                method: 'POST',
                headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ sessionId: sid }),
            });
            const fin = await finRes.json(); // { ok, reportId }
            if (fin.ok && fin.reportId != null) {
                nav(`/feedback?reportId=${fin.reportId}`);
            } else {
                // 리포트가 없을 때 임시 요약으로 이동(기존 로직 유지)
                const total = messages.length + (userText ? 1 : 0) + (aiText ? 1 : 0);
                const userTurns = (messages.filter(m => m.role === 'user').length) + (userText ? 1 : 0);
                const aiTurns = (messages.filter(m => m.role === 'ai').length) + (aiText ? 1 : 0);
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
                    feedback: `세션 요약 - 주제: ${topic || 'Voice Session'} - 총 메시지: ${total} (사용자 ${userTurns}, AI ${aiTurns})`,
                    score,
                    level: (score >= 90 ? 'excellent' : score >= 75 ? 'good' : 'needs-work') as 'excellent' | 'good' | 'needs-work',
                    date: new Date().toISOString().slice(0, 10),
                };
                nav('/feedback', { state: { newFeedback } });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setProcessing(false);
            // 다음 세션 위해 초기화(원한다면 유지 가능)
            setStarted(false);
            setTopic('');
            setSessionId(null);
            setMessages([]);
        }
    }, [ensureSession, nav, stopAndGetBlob, token, topic, messages]);

    const toggle = () => (recording ? stopAndRecognize() : start());

    /* === Topic === */
    const beginTopic = async (t: string) => {
        setTopic(t);
        setStarted(true);
        addMsg('ai', `Let's start a voice roleplay about "${t}". Speak when you're ready!`);
        // 시작과 동시에 세션 준비(첫 클릭 때도 준비하지만 UX 빠르게)
        try { await ensureSession(); } catch {}
    };

    /* === 상단 종료 버튼(수동 종료) === */
    const exit = async () => {
        if (recording) await stopAndRecognize();
        else {
            // 녹음 중이 아니더라도 세션이 있으면 finalize 시도
            if (sessionId) {
                try {
                    await fetch('/api/voice/session/finalize', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ sessionId }),
                    });
                } catch {}
            }
            setStarted(false);
            setTopic('');
            setSessionId(null);
            setMessages([]);
            nav('/home');
        }
    };

    const topics = [
        { emoji: '🏥', label: '병원', t: 'Visiting a doctor at the hospital' },
        { emoji: '🍽️', label: '레스토랑', t: 'Ordering food at a restaurant' },
        { emoji: '✈️', label: '공항', t: 'Check-in and boarding at the airport' },
        { emoji: '🏨', label: '호텔', t: 'Checking in at a hotel' },
    ];

    useEffect(() => {
        return () => {
            // 언마운트 시 정리
            try {
                if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
                (mediaRecorderRef.current as any)?.stream?.getTracks?.().forEach((t: MediaStreamTrack) => t.stop());
            } catch {}
        };
    }, []);

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
                                <div className="sr-warn">이 브라우저는 마이크 녹음을 지원하지 않아요. (Chrome 권장)</div>
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
                            {processing && <div className="processing">Processing…</div>}
                        </div>

                        <div className="voice-controls">
                            <button
                                className={`mic-btn ${recording ? 'active' : ''}`}
                                onClick={toggle}
                                disabled={supported === false || processing}
                                aria-pressed={recording}
                                aria-label={recording ? '녹음 중지' : '녹음 시작'}
                            >
                                <span className="mic-icon" aria-hidden>🎙️</span>
                            </button>
                            <div className="wave" aria-hidden><span/><span/><span/><span/><span/></div>
                        </div>

                        <audio ref={audioRef} controls style={{ display: 'none' }} />
                    </>
                )}
            </div>
        </div>
    );
}
