// src/pages/Feedback.tsx
import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import './Feedback.css';

/** ==== Types ==== */
type Topic = 'Grammar' | 'Vocabulary' | 'Conversation';
type Level = 'excellent' | 'good' | 'needs-work';

type Report = {
  id: number;
  date: string; // yyyy-mm-dd
  topic: string;
  avgGrammar?: number | null;
  avgVocabulary?: number | null;
  avgConversation?: number | null;
};

type DetailDTO = {
  topics: Topic[];   // 복수 카테고리
  feedback: string;  // (grammar/vocabulary/conv 합친 텍스트 혹은 서버에서 가공)
  score: number;     // 0~100
  level: Level;
  date: string;      // yyyy-mm-dd (보여줄 용)
};

/** ==== 서버 호출 유틸 ==== */
async function fetchReportDates(): Promise<string[]> {
  const res = await fetch('/api/feedback/report-dates', { credentials: 'include' });
  if (!res.ok) return [];
  return await res.json();
}

async function fetchReportsByDate(date: string): Promise<Report[]> {
  const res = await fetch(`/api/feedback/reports?date=${encodeURIComponent(date)}`, {
    credentials: 'include',
  });
  if (!res.ok) return [];
  return await res.json();
}

async function fetchDetailsByReportId(reportId: number): Promise<DetailDTO[]> {
  const res = await fetch(`/api/feedback/details?reportId=${reportId}`, {
    credentials: 'include',
  });
  if (!res.ok) return [];
  return await res.json();
}

/** ==== 탭 ==== */
const TABS: Array<'All' | Topic> = ['All', 'Grammar', 'Vocabulary', 'Conversation'];

export default function Feedback() {
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: { highlightReportId?: number };
  };
  const [searchParams, setSearchParams] = useSearchParams();

  /** 상태 */
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  const [details, setDetails] = useState<DetailDTO[]>([]);

  const [activeTab, setActiveTab] = useState<'All' | Topic>('All');

  /** URL ?date=yyyy-mm-dd 지원 */
  const initialDateFromUrl = searchParams.get('date');

  /** 최초: 날짜 목록 로드 */
  useEffect(() => {
    (async () => {
      const d = await fetchReportDates();
      setDates(d);
      // URL에 date가 있으면 우선 적용, 없으면 선택 대기
      if (initialDateFromUrl && d.includes(initialDateFromUrl)) {
        setSelectedDate(initialDateFromUrl);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 날짜가 선택되면 리포트 목록 로드 */
  useEffect(() => {
    if (!selectedDate) return;
    (async () => {
      const list = await fetchReportsByDate(selectedDate);
      setReports(list);

      // 하이라이트 reportId가 있으면 우선 선택
      const targetId = location.state?.highlightReportId ?? null;

      if (targetId && list.some(r => r.id === targetId)) {
        setSelectedReportId(targetId);
      } else if (list.length === 1) {
        // 하나뿐이면 자동 선택
        setSelectedReportId(list[0].id);
      } else {
        setSelectedReportId(null);
        setDetails([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  /** 리포트가 선택되면 디테일 로드 */
  useEffect(() => {
    if (!selectedReportId) return;
    (async () => {
      const det = await fetchDetailsByReportId(selectedReportId);
      setDetails(det);
    })();
  }, [selectedReportId]);

  /** 날짜 카드 클릭 */
  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSearchParams({ date }); // 주소창 반영
    setActiveTab('All');
  };

  /** 날짜 초기화 */
  const resetDate = () => {
    setSelectedDate(null);
    setReports([]);
    setSelectedReportId(null);
    setDetails([]);
    searchParams.delete('date');
    setSearchParams(searchParams, { replace: true });
  };

  /** 탭 기반 필터 */
  const filtered = useMemo(
      () =>
          activeTab === 'All'
              ? details
              : details.filter(f => (f.topics ?? []).includes(activeTab)),
      [activeTab, details]
  );

  /** 평균 점수(현재 필터 반영) */
  const avgScore = useMemo(() => {
    if (filtered.length === 0) return 0;
    return Math.round(filtered.reduce((sum, f) => sum + f.score, 0) / filtered.length);
  }, [filtered]);

  const levelLabel = (level: Level) =>
      level === 'excellent' ? '우수' : level === 'good' ? '양호' : '개선 필요';

  /** 선택된 리포트(요약 평균 등 표시용으로 쓰고 싶으면 사용) */
  const selectedReport = useMemo(
      () => reports.find(r => r.id === selectedReportId) ?? null,
      [reports, selectedReportId]
  );

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
                  {dates.length > 0 && (
                      <button className="date-reset" onClick={resetDate}>
                        초기화
                      </button>
                  )}
                </h3>

                {dates.length === 0 ? (
                    <p className="empty">아직 등록된 피드백 날짜가 없습니다.</p>
                ) : (
                    <div className="date-picker" role="listbox" aria-label="피드백 날짜 목록">
                      {dates.map(date => (
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

          {/* [Step 2] 날짜 선택 후 상세 */}
          {selectedDate && (
              <>
                <h3 className="date-section-title">
                  📅 선택한 날짜: <span>{selectedDate}</span>
                  <button className="date-reset" onClick={resetDate}>
                    다른 날짜 선택
                  </button>
                </h3>

                {/* (선택) 리포트 선택: 동일 날짜에 여러 리포트가 있을 때 */}
                {reports.length > 1 && (
                    <div className="report-picker" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                      <span style={{ alignSelf: 'center' }}>리포트 선택:</span>
                      {reports.map(r => (
                          <button
                              key={r.id}
                              className={`report-chip ${selectedReportId === r.id ? 'active' : ''}`}
                              onClick={() => setSelectedReportId(r.id)}
                              title={`평균 G:${r.avgGrammar ?? '-'} / V:${r.avgVocabulary ?? '-'} / C:${r.avgConversation ?? '-'}`}
                          >
                            {r.topic || 'No Topic'}
                          </button>
                      ))}
                    </div>
                )}

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
                  {/* 선택된 리포트의 카테고리별 평균(서버 계산치)을 참고용으로 보여주고 싶다면: */}
                  {selectedReport && (
                      <>
                        <div className="summary-item">
                          <span className="summary-label">Grammar 평균</span>
                          <strong className="summary-value">
                            {selectedReport.avgGrammar ?? '-'}
                          </strong>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Vocabulary 평균</span>
                          <strong className="summary-value">
                            {selectedReport.avgVocabulary ?? '-'}
                          </strong>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Conversation 평균</span>
                          <strong className="summary-value">
                            {selectedReport.avgConversation ?? '-'}
                          </strong>
                        </div>
                      </>
                  )}
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
                {selectedReportId == null ? (
                    <p className="empty">리포트를 선택하세요.</p>
                ) : filtered.length === 0 ? (
                    <p className="empty">이 날짜에는 선택한 카테고리의 피드백이 없습니다.</p>
                ) : (
                    <ul className="feedback-list" role="list">
                      {filtered.map((item, idx) => (
                          <li key={`${item.date}-${idx}`} className="feedback-item">
                            <div className="item-head">
                              {/* 여러 카테고리 뱃지 */}
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
