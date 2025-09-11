import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Feedback.css';

type Level = 'excellent' | 'good' | 'needs-work';

type FeedbackItem = {
  topic: 'Grammar' | 'Vocabulary' | 'Conversation';
  feedback: string;
  score: number; // 0~100
  level: Level;
  date: string; // yyyy-mm-dd
};

const INITIAL_FEEDBACK: FeedbackItem[] = [
  {
    topic: 'Grammar',
    feedback: '문법적 오류가 일부 있었어요. 시제 일치와 관사 사용을 중심으로 보완해보면 좋아요.',
    score: 72,
    level: 'needs-work',
    date: '2025-09-09',
  },
  {
    topic: 'Vocabulary',
    feedback: '단어 선택은 적절했어요. 같은 표현 반복을 줄이고 동의어를 다양화해보면 더 좋아요.',
    score: 84,
    level: 'good',
    date: '2025-09-09',
  },
  {
    topic: 'Conversation',
    feedback: '대화 흐름은 자연스러웠고 템포도 좋았어요. 억양/발음은 특정 단어에서 살짝 뭉개졌어요.',
    score: 88,
    level: 'good',
    date: '2025-09-08',
  },
];

const TABS: Array<'All' | FeedbackItem['topic']> = ['All', 'Grammar', 'Vocabulary', 'Conversation'];

export default function Feedback() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { newFeedback?: FeedbackItem } };

  const initialList = location.state?.newFeedback
    ? [location.state.newFeedback, ...INITIAL_FEEDBACK]
    : INITIAL_FEEDBACK;

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('All');
  const [feedbackList] = useState<FeedbackItem[]>(initialList);

  const filtered = useMemo(
    () => (activeTab === 'All' ? feedbackList : feedbackList.filter(f => f.topic === activeTab)),
    [activeTab, feedbackList]
  );

  const avgScore = useMemo(() => {
    if (filtered.length === 0) return 0;
    return Math.round(filtered.reduce((sum, f) => sum + f.score, 0) / filtered.length);
  }, [filtered]);

  const levelLabel = (level: Level) =>
    level === 'excellent' ? '우수' : level === 'good' ? '양호' : '개선 필요';

  return (
    <div className="feedback-container">
      {/* compact 클래스로 크기 축소 + 내부 스크롤 */}
      <div className="feedback-card compact">
        {/* Header */}
        <div className="feedback-header">
          <button className="back-button" aria-label="뒤로가기" onClick={() => navigate('/home')}>
            &lt;
          </button>
          <h2>💬 피드백</h2>
        </div>

        {/* Summary */}
        <section className="summary">
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
          <p className="empty">아직 피드백이 없습니다.</p>
        ) : (
          <ul className="feedback-list" role="list">
            {filtered.map((item, idx) => (
              <li key={idx} className="feedback-item">
                <div className="item-head">
                  <span className={`topic-badge topic-${item.topic.toLowerCase()}`}>
                    {item.topic}
                  </span>
                  <span className={`level-chip level-${item.level}`}>{levelLabel(item.level)}</span>
                </div>

                {/* Score bar */}
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
      </div>
    </div>
  );
}
