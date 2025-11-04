// src/pages/Feedback.tsx
import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import './Feedback.css';

/** ==== Types ==== */
type Topic = 'Grammar' | 'Vocabulary' | 'Conversation';
type Level = 'excellent' | 'good' | 'needs-work';

type FeedbackItem = {
  topics: Topic[];          // 복수 카테고리 지원
  feedback: string;
  score: number;            // 0~100
  level: Level;
  date: string;             // yyyy-mm-dd
};

/** ==== (데모) 초기 데이터 - 과거 단일 topic 형식도 섞여 있어도 OK ==== */
type RawFeedback = {
  topics?: unknown;         // 배열/문자열/누락 모두 가능
  topic?: unknown;          // 과거 단일 키
  feedback?: unknown;
  score?: unknown;
  level?: unknown;
  date?: unknown;
};

const INITIAL_FEEDBACK_RAW: RawFeedback[] = [
  {
    topic: 'Grammar',
    feedback: '문법적 오류가 일부 있었어요. 시제 일치와 관사 사용을 중심으로 보완해보면 좋아요.',
    score: 72, level: 'needs-work', date: '2025-09-09',
  },
  {
    topic: 'Vocabulary',
    feedback: '단어 선택은 적절했어요. 같은 표현 반복을 줄이고 동의어를 다양화해보면 더 좋아요.',
    score: 84, level: 'good', date: '2025-09-09',
  },
  {
    topic: 'Conversation',
    feedback: '대화 흐름은 자연스러웠고 템포도 좋았어요. 억양/발음은 특정 단어에서 살짝 뭉개졌어요.',
    score: 88, level: 'good', date: '2025-09-08',
  },
  // 복수 카테고리 예시
  {
    topics: ['Grammar', 'Vocabulary'],
    feedback: '시제와 단어 선택 모두 개선 포인트가 있어요.',
    score: 78, level: 'good', date: '2025-09-10',
  },
  {
    topics: 'Grammar, Vocabulary, Conversation',
    feedback: '전반적으로 고르게 발전 가능성이 보여요.',
    score: 81, level: 'good', date: '2025-09-11',
  },
];

/** ==== 유틸: 모든 입력을 topics: Topic[] 로 정규화 ==== */
const toTopics = (raw: unknown): Topic[] => {
  const asTopic = (v: string): Topic | null =>
    v === 'Grammar' || v === 'Vocabulary' || v === 'Conversation' ? v : null;

  if (Array.isArray(raw)) {
    const arr = raw.map(String).map(s => s.trim()).map(asTopic).filter(Boolean) as Topic[];
    return arr.length ? arr : ['Grammar'];
  }
  if (typeof raw === 'string') {
    const arr = raw.split(',').map(s => s.trim()).map(asTopic).filter(Boolean) as Topic[];
    return arr.length ? arr : ['Grammar'];
  }
  return ['Grammar'];
};

const normalizeItem = (raw: RawFeedback): FeedbackItem => ({
  topics: toTopics(raw.topics ?? raw.topic),
  feedback: String(raw.feedback ?? ''),
  score: Number(raw.score ?? 0),
  level:
    raw.level === 'excellent' || raw.level === 'good' || raw.level === 'needs-work'
      ? (raw.level as Level)
      : 'good',
  date: String(raw.date ?? ''),
});

/** ==== 탭 ==== */
const TABS: Array<'All' | Topic> = ['All', 'Grammar', 'Vocabulary', 'Conversation'];

export default function Feedback() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { newFeedback?: RawFeedback | RawFeedback[] } };
  const [searchParams, setSearchParams] = useSearchParams();

  /** location.state -> 배열/단일 모두 수용 후 정규화 */
  const fromStateRaw: RawFeedback[] = Array.isArray(location.state?.newFeedback)
    ? (location.state?.newFeedback as RawFeedback[])
    : location.state?.newFeedback
    ? [location.state.newFeedback as RawFeedback]
    : [];

  const initialList: FeedbackItem[] = [...fromStateRaw, ...INITIAL_FEEDBACK_RAW].map(normalizeItem);

  const [activeTab, setActiveTab] = useState<'All' | Topic>('All');
  const [feedbackList] = useState<FeedbackItem[]>(initialList);

  /** 사용 가능한 날짜 목록 (중복 제거 + 최신순) */
  const availableDates = useMemo(() => {
    const set = new Set(feedbackList.map(f => f.date));
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1)); // desc
  }, [feedbackList]);

  /** URL ?date=yyyy-mm-dd 지원 */
  const initialDateFromUrl = searchParams.get('date');
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDateFromUrl);

  useEffect(() => {
    if (initialDateFromUrl && availableDates.includes(initialDateFromUrl)) {
      setSelectedDate(initialDateFromUrl);
    } else if (initialDateFromUrl && !availableDates.includes(initialDateFromUrl)) {
      searchParams.delete('date');
      setSearchParams(searchParams, { replace: true });
      setSelectedDate(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDateFromUrl, availableDates.join('|')]);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSearchParams({ date }); // 주소창 반영
  };

  const resetDate = () => {
    setSelectedDate(null);
    searchParams.delete('date');
    setSearchParams(searchParams, { replace: true });
  };

  /** 날짜 기반 1차 필터 */
  const dateFiltered = useMemo(() => {
    if (!selectedDate) return [];
    return feedbackList.filter(f => f.date === selectedDate);
  }, [feedbackList, selectedDate]);

  /** 탭 기반 2차 필터 (복수 카테고리 대응) */
  const filtered = useMemo(
    () =>
      activeTab === 'All'
        ? dateFiltered
        : dateFiltered.filter(f => (f.topics ?? []).includes(activeTab)),
    [activeTab, dateFiltered]
  );

  const avgScore = useMemo(() => {
    if (filtered.length === 0) return 0;
    return Math.round(filtered.reduce((sum, f) => sum + f.score, 0) / filtered.length);
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

        {/* [Step 1] 날짜 선택 */}
        {!selectedDate && (
          <>
            <h3 className="date-section-title">
              📅 날짜 선택
              {availableDates.length > 0 && (
                <button className="date-reset" onClick={resetDate}>
                  초기화
                </button>
              )}
            </h3>

            {availableDates.length === 0 ? (
              <p className="empty">아직 등록된 피드백 날짜가 없습니다.</p>
            ) : (
              <div className="date-picker" role="listbox" aria-label="피드백 날짜 목록">
                {availableDates.map(date => (
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

            {/* Summary */}
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

            {/* Tabs */}
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

            {/* List */}
            <h3 className="section-title">사용자 피드백</h3>
            {filtered.length === 0 ? (
              <p className="empty">이 날짜에는 선택한 카테고리의 피드백이 없습니다.</p>
            ) : (
              <ul className="feedback-list" role="list">
                {filtered.map((item, idx) => (
                  <li key={`${item.date}-${idx}`} className="feedback-item">
                    <div className="item-head">
                      {/* 여러 카테고리 뱃지 (가드 포함) */}
                      <div className="topic-badges" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(item.topics ?? []).map(t => (
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
                      <p className="feedback-text">{item.feedback}</p>
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
