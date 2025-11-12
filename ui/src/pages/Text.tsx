// src/pages/Text.tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Chat.css';

type FbLevel = 'perfect' | 'neutral' | 'needs';
type VocaItem = { word: string; meaningKo?: string | null; example?: string | null; known?: boolean };

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
    score?: number;
    category?: string;
    feedback?: Feedback;
};

const levelByScore = (s: number): FbLevel => (s >= 92 ? 'perfect' : s <= 74 ? 'needs' : 'neutral');
const labelByLevel = (lv: FbLevel) => (lv === 'perfect' ? '완벽한 표현' : lv === 'neutral' ? '무난한 표현' : '개선 필요');

function parseFeedbackParts(feedbackText: string) {
    const grammarText = feedbackText.match(/grammar:\s*([\s\S]*?)(?=\n\s*vocabulary:|\n\s*suggestion:|$)/i)?.[1]?.trim() || '';
    const vocabText   = feedbackText.match(/vocabulary:\s*([\s\S]*?)(?=\n\s*suggestion:|$)/i)?.[1]?.trim() || '';
    const suggestion  = feedbackText.match(/suggestion:\s*([\s\S]*)/i)?.[1]?.trim() || '';
    let explain = '';
    if (grammarText && vocabText) explain = `${grammarText}\n${vocabText}`;
    else if (grammarText) explain = grammarText;
    else if (vocabText) explain = vocabText;
    return { explain, suggestion, grammarText, vocabText };
}

const AI_BASE = 'http://localhost:8000';
const START_PATHS = ['/api/text/start'];
const SEND_PATHS  = ['/api/text/send'];

async function postJsonTry(paths: string[], body: any, bases = [AI_BASE]) {
    for (const base of bases) {
        for (const p of paths) {
            try {
                const res = await fetch(`${base}${p}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                if (res.ok) return await res.json();
            } catch {}
        }
    }
    throw new Error('All endpoints not found');
}

const fmtTime = (ts: number) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

export default function Chat() {
    const [isTopicSelected, setIsTopicSelected] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [pendingVoca, setPendingVoca] = useState<VocaItem[]>([]);  // ✅ 이동: 컴포넌트 내부
    const navigate = useNavigate();
    const currentUserId = Number(localStorage.getItem('userId') ?? '0');

    const getLastTurn = () => {
        const rev = [...messages].reverse();
        const lastUser = rev.find(m => m.role === 'user' && m.feedback);
        const lastAi   = rev.find(m => m.role === 'ai');
        return { lastUser, lastAi };
    };

    const endRef = useRef<HTMLDivElement | null>(null);
    const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(() => { scrollToBottom(); }, [messages]);

    const addMessage = (role: 'ai' | 'user', content: string) => {
        setMessages(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, role, content, time: Date.now() }]);
    };

    const rolesByTopic = (label: string) =>
        label.includes('병원') ? { ai_role:'doctor',  user_role:'patient' } :
            label.includes('레스토랑') ? { ai_role:'waiter',  user_role:'customer' } :
                label.includes('공항') ? { ai_role:'staff',   user_role:'passenger' } :
                    label.includes('호텔') ? { ai_role:'clerk',   user_role:'guest' } :
                        { ai_role:'tutor', user_role:'student' };

    const handleTopicSelect = async (label: string) => {
        setSelectedTopic(label);
        setIsTopicSelected(true);
        setMessages([]);
        const sid = (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
        setSessionId(sid);
        addMessage('ai', `Let's start the roleplay about "${label}". You can type your first line!`);
        const { ai_role, user_role } = rolesByTopic(label);
        try {
            await fetch(`${AI_BASE}/api/text/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: label, ai_role, user_role }),
            });
        } catch {}
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text) return;

        const msgId = `${Date.now()}-${Math.random()}`;
        setMessages(prev => [...prev, { id: msgId, role: 'user', content: text, time: Date.now() }]);
        setInput('');

        const { ai_role, user_role } = rolesByTopic(selectedTopic || 'General');

        try {
            const data = await postJsonTry(SEND_PATHS, {
                topic: selectedTopic || 'General',
                ai_role, user_role, message: text,
            });

            // 1) AI Reply 표시
            const aiText = (data?.reply ?? '').toString();
            const replyMatch = aiText.match(/\[AI Reply\]:(.*?)(?=\[Feedback\]|$)/s);
            const aiReply = (replyMatch ? replyMatch[1] : aiText).trim();
            addMessage('ai', aiReply || '(no reply)');

            // 2) 피드백 섹션 (우선: 백엔드 필드 → 폴백: 정규식)
            const rawFeedback = (aiText.match(/\[Feedback\]:(.*)/s)?.[1] || '').trim();
            const grammarText = (data?.grammar ?? '').toString().trim();
            const vocabText   = (data?.vocabulary ?? '').toString().trim();
            const suggText    = (data?.suggestion ?? '').toString().trim();

            let explain = '';
            let suggestion = '';
            if (grammarText || vocabText || suggText) {
                if (grammarText && vocabText) explain = `${grammarText}\n${vocabText}`;
                else if (grammarText) explain = grammarText;
                else if (vocabText) explain = vocabText;
                suggestion = suggText || '';
            } else if (rawFeedback) {
                const parsed = parseFeedbackParts(rawFeedback);
                explain = parsed.explain;
                suggestion = parsed.suggestion;
            }

            // 3) 점수/레벨
            const score: number =
                typeof data?.score === 'number' && Number.isFinite(data.score) ? Math.max(0, Math.min(100, data.score)) : 75;

            // 백엔드 level이 오면 우선 사용(없으면 기존 규칙)
            const serverLevel: string | undefined = typeof data?.level === 'string' ? data.level : undefined;
            const level: FbLevel = serverLevel === 'excellent' ? 'perfect'
                : serverLevel === 'good' ? 'neutral'
                    : serverLevel === 'needs-work' ? 'needs'
                        : levelByScore(score);

            const label = labelByLevel(level);

            // 4) 화면 표시용 피드백 덧붙이기
            if (explain || suggestion || Number.isFinite(score)) {
                setMessages(prev => prev.map(m =>
                    m.id === msgId
                        ? {
                            ...m,
                            feedback: { level, label, score, explain, suggestion, original: text },
                        }
                        : m
                ));
            }

            // 5) 카테고리 및 단어장, 서버 저장
            const categoriesFromAI: Array<'GRAMMAR' | 'VOCABULARY'> = Array.isArray(data?.categories) ? data.categories : [];
            // 폴백 규칙(백엔드가 비워주면): '완벽/perfect' 아니면 문제로 간주
            const isPerfect = (t: string) => /완벽|perfect/i.test(t);
            const fallbackCats: Array<'GRAMMAR' | 'VOCABULARY'> = [];
            if (grammarText && !isPerfect(grammarText)) fallbackCats.push('GRAMMAR');
            if (vocabText && !isPerfect(vocabText))    fallbackCats.push('VOCABULARY');

            const categories: Array<'GRAMMAR' | 'VOCABULARY'> =
                categoriesFromAI.length ? categoriesFromAI : fallbackCats;

            // voca가 오면 중복 없이 모아두기(선택)
            const voca: VocaItem[] = Array.isArray(data?.voca) ? data.voca : [];
            if (voca.length) {
                setPendingVoca(prev => {
                    const map = new Map<string, VocaItem>();
                    [...prev, ...voca].forEach(v => {
                        const key = v.word.toLowerCase();
                        const ex = map.get(key);
                        if (!ex) map.set(key, { ...v, known: false });
                        else {
                            map.set(key, {
                                word: ex.word, known: false,
                                meaningKo: ex.meaningKo || v.meaningKo || null,
                                example: ex.example || v.example || null,
                            });
                        }
                    });
                    return Array.from(map.values());
                });
            }

            // 서버(스프링) 임시 저장
            try {
                await fetch('/api/feedback/detail', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: sessionId || selectedTopic || 'text-session',
                        userMessage: text,
                        grammarFeedback: categories.includes('GRAMMAR') ? (grammarText || null) : null,
                        vocabularyFeedback: categories.includes('VOCABULARY') ? (vocabText || null) : null,
                        score,
                        level,                // 문자열('perfect'|'neutral'|'needs') 그대로 저장해도 되고,
                                              // 필요시 서버에서 매핑해 'excellent|good|needs-work'로 변환 가능
                        categories,           // ["GRAMMAR","VOCABULARY"] 등 (Enum과 매칭)
                    }),
                });
            } catch {
                console.warn('detail save failed');
            }
        } catch {
            addMessage('ai', '⚠️ AI 서버와의 통신에 실패했습니다.');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
    };

    const handleExit = async () => {
        const { lastUser, lastAi } = getLastTurn();
        if (!currentUserId) { alert('로그인 정보가 없습니다.'); navigate(-1); return; }
        if (!lastUser || !lastAi) { alert('저장할 피드백이 없습니다.'); navigate(-1); return; }

        try {
            if (pendingVoca.length) {
                const body = { items: pendingVoca.map(v => ({
                        word: v.word, meaningKo: v.meaningKo ?? null, example: v.example ?? null, known: false
                    }))};
                await fetch('/api/voca/bulk', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
                }).catch(() => {});
                setPendingVoca([]); // 중복 방지
            }

            const res = await fetch('/api/feedback/finalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: sessionId || selectedTopic || 'text-session', topic: selectedTopic || 'General' }),
            });

            const today = new Date().toISOString().slice(0, 10);
            if (res.status === 204) {
                alert('이번 대화에 저장할 피드백이 없어 리포트는 생성되지 않았어요.');
                navigate(`/feedback?date=${today}`, { replace: true });
                return;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            let payload: any = null;
            try { payload = await res.json(); } catch {}
            const reportId: number | undefined =
                typeof payload?.reportId === 'number' ? payload.reportId : (payload && Number(payload)) || undefined;

            navigate(`/feedback?date=${today}`, {
                replace: true,
                state: reportId ? { highlightReportId: reportId } : undefined,
            });
        } catch (e) {
            console.error(e);
            alert('피드백 저장 중 오류가 발생했습니다.');
            navigate(-1);
        }
    };

    const topics = [
        { emoji: '🏥', label: '병원', t: 'Visiting a doctor at the hospital' },
        { emoji: '🍽️', label: '레스토랑', t: 'Ordering food at a restaurant' },
        { emoji: '✈️', label: '공항', t: 'Check-in and boarding at the airport' },
        { emoji: '🏨', label: '호텔', t: 'Checking in at a hotel' },
    ];

    return (
        <div className="chat-container">
            <div className="chat-box">

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
