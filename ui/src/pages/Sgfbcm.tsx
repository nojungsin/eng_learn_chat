// src/pages/Sgfbcm.tsx
import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchWithAuth } from "../lib/api";
import './Sgfbcm.css';

/** ==== Types ==== */
type Category = 'Grammar' | 'Vocabulary' | 'Conversation';
type Level = 'excellent' | 'good' | 'needs-work';

type FeedbackItem = {
    categories: Category[];
    feedback: string;
    score: number;
    level: Level;
    date: string; // yyyy-mm-dd
};

type ReportDate = { reportId: number; date: string };

/** ==== API ==== */
/*선택 가능한 보고서 목록 불러오기*/
async function fetchReportDates(userId: number): Promise<ReportDate[]> {
    const res = await fetchWithAuth(`/api/feedback/report-dates`)
    if (!res.ok) throw new Error('failed to load report dates');
    return res.json();
}

/*보고서 목록에서 선택한 보고서의 세부 details들 불러오기*/
async function fetchDetails(userId: number, reportId: number): Promise<FeedbackItem[]> {
    const res = await fetchWithAuth(`/api/feedback/reports/${reportId}/details`);
    if (!res.ok) throw new Error('failed to load details');
    const data = (await res.json()) as FeedbackItem[];
    // 토픽/레벨 가드 (혹시 서버가 빈 토픽 보낼 때 대비)
    const asTopic = (v: string): Category | null =>
        v === 'Grammar' || v === 'Vocabulary' || v === 'Conversation' ? v : null;

    return data.map(d => ({
        categories: Array.isArray(d.categories)
            ? (d.categories.map(String).map(s => s.trim()).map(asTopic).filter(Boolean) as Category[])
            : ['Grammar'],
        feedback: String(d.feedback ?? ''),
        score: Number.isFinite(d.score as number) ? (d.score as number) : 0,
        level:
            d.level === 'excellent' || d.level === 'good' || d.level === 'needs-work'
                ? (d.level as Level)
                : 'good',
        date: String(d.date ?? ''),
    }));
}

/** ==== 유틸 ==== */
const TABS: Array<'All' | Category> = ['All', 'Grammar', 'Vocabulary', 'Conversation'];

/** ==== 실제 페이지 ==== */
export default function Sgfbcm() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // ★ 현재 로그인 사용자 ID를 얻는 부분 (네 프로젝트 방식에 맞춰 수정해)
    // - 예: 로그인 시 localStorage.setItem('userId', '123');
    const getCurrentUserId = (): number | null => {
        const raw = localStorage.getItem('userId');
        if (!raw) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    };

    const [userId, setUserId] = useState<number | null>(getCurrentUserId());
    const [dates, setDates] = useState<ReportDate[]>([]);
    const [loadingDates, setLoadingDates] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initialDateFromUrl = searchParams.get('date');
    const [selectedDate, setSelectedDate] = useState<string | null>(initialDateFromUrl);

    const [activeTab, setActiveTab] = useState<'All' | Category>('All');
    const [items, setItems] = useState<FeedbackItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    /** Step 1: userId로 날짜 목록 로드 */
    useEffect(() => {
        if (!userId) return;

        (async () => {
            setLoadingDates(true);
            setError(null);
            try {
                const list = await fetchReportDates(userId);
                setDates(list);
                // URL ?date=... 있으면 유지, 없으면 최신 날짜 자동 선택 X (사용자 클릭)
                if (initialDateFromUrl) {
                    const ok = list.some(r => r.date === initialDateFromUrl);
                    if (!ok) {
                        searchParams.delete('date');
                        setSearchParams(searchParams, { replace: true });
                        setSelectedDate(null);
                    }
                }
            } catch (e: any) {
                setError(e?.message ?? '날짜 로드 실패');
            } finally {
                setLoadingDates(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    /** Step 2: 날짜 선택 → reportId 찾고 detail 로드 */
    useEffect(() => {
        if (!userId || !selectedDate) {
            setItems([]);
            return;
        }
        const found = dates.find(d => d.date === selectedDate);
        if (!found) {
            setItems([]);
            return;
        }
        (async () => {
            setLoadingItems(true);
            setError(null);
            try {
                const data = await fetchDetails(userId, found.reportId);
                setItems(data);
            } catch (e: any) {
                setError(e?.message ?? '상세 로드 실패');
                setItems([]);
            } finally {
                setLoadingItems(false);
            }
        })();
    }, [userId, selectedDate, dates]);

    /** UI 핸들러 */
    const handleSelectDate = (date: string) => {
        setSelectedDate(date);
        setSearchParams({ date }); // 주소창 반영
    };

    //다시feedbackreport 목록 불러오기
    const resetDate = () => {
        setSelectedDate(null);
        searchParams.delete('date');
        setSearchParams(searchParams, { replace: true });
        setItems([]);
    };

    /** 탭 필터 */
    const filtered = useMemo(
        () =>
            activeTab === 'All'
                ? items
                : items.filter(f => (f.categories ?? []).includes(activeTab)),
        [activeTab, items]
    );

    const avgScore = useMemo(() => {
        if (filtered.length === 0) return 0;
        const v = Math.round(filtered.reduce((s, x) => s + x.score, 0) / filtered.length);
        return v;
    }, [filtered]);

    const levelLabel = (level: Level) =>
        level === 'excellent' ? '우수' : level === 'good' ? '양호' : '개선 필요';

    return (
        <div className="feedback-container">
            <div className="feedback-card compact">
                {/* Header */}
                <div className="feedback-header">
                    <h2>💬 피드백</h2>
                    <button
                        type="button"
                        className="close-button"
                        aria-label="닫기"
                        onClick={() => navigate('/home', { replace: true })}
                    >
                        ×
                    </button>
                </div>

                {!userId && (
                    <p className="empty">로그인 정보가 없습니다. userId 설정이 필요합니다.</p>
                )}

                {error && <p className="empty">⚠ {error}</p>}

                {/* [Step 1] 날짜 선택 */}
                {!selectedDate && userId && (
                    <>
                        <h3 className="date-section-title">
                            📅 날짜 선택
                            {dates.length > 0 && (
                                <button className="date-reset" onClick={resetDate}>
                                    초기화
                                </button>
                            )}
                        </h3>

                        {loadingDates ? (
                            <p className="empty">로딩 중…</p>
                        ) : dates.length === 0 ? (
                            <p className="empty">아직 등록된 피드백 날짜가 없습니다.</p>
                        ) : (
                            <div className="date-picker" role="listbox" aria-label="피드백 날짜 목록">
                                {dates.map(({ date }) => (
                                    <button
                                        key={date}
                                        className={`date-card ${selectedDate === date ? 'active' : ''}`}
                                        role="option"
                                        aria-selected={selectedDate === date}
                                        onClick={() => handleSelectDate(date)}
                                    >
                                        {date}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* [Step 2] 상세 */}
                {selectedDate && (
                    <>
                        <h3 className="date-section-title">
                            📅 선택한 날짜: <span>{selectedDate}</span>
                            <button className="date-reset" onClick={resetDate}>
                                다른 날짜 선택
                            </button>
                        </h3>

                        <section className="summary" aria-label="요약">
                            <div className="summary-item">
                                <span className="summary-label">총 항목</span>
                                <strong className="summary-value">{filtered.length}개</strong>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">평균 점수</span>
                                <strong className="summary-value">{avgScore}</strong>
                            </div>
                        </section>

                        <nav className="tabs" aria-label="피드백 카테고리">
                            {TABS.map(tab => (
                                <button
                                    key={tab}
                                    className={`tab ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab === 'All' ? '전체' : tab}
                                </button>
                            ))}
                        </nav>

                        {loadingItems ? (
                            <p className="empty">로딩 중…</p>
                        ) : filtered.length === 0 ? (
                            <p className="empty">선택한 카테고리의 피드백이 없습니다.</p>
                        ) : (
                            <ul className="feedback-list" role="list">
                                {filtered.map((item, idx) => (
                                    <li key={`${item.date}-${idx}`} className="feedback-item">
                                        <div className="item-head">
                                            <div className="topic-badges" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {(item.categories ?? []).map(t => (
                                                    <span key={t} className={`topic-badge topic-${t.toLowerCase()}`}>
                            {t}
                          </span>
                                                ))}
                                            </div>
                                            <span className={`level-chip level-${item.level}`}>
                        {levelLabel(item.level)}
                      </span>
                                        </div>

                                        <div className="score-wrap" aria-label={`점수: ${item.score}점`}>
                                            <div className="score-bar">
                                                <div className="score-fill" style={{ width: `${item.score}%` }} />
                                            </div>
                                            <span className="score-text">{item.score}</span>
                                        </div>

                                        <details className="feedback-details">
                                            <summary className="details-summary">세부 코멘트 보기</summary>
                                            <p className="feedback-text" style={{ whiteSpace: 'pre-wrap' }}>
                                                {item.feedback}
                                            </p>
                                        </details>

                                        <div className="meta">
                                            <span className="date">🗓 {item.date}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
