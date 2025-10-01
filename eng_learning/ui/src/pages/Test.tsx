import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Test.css';

type QChoice = {
  type: 'choice';
  question: string;
  options: string[];
  answer: string;
};
type QSpeech = {
  type: 'speech';
  question: string;
  answer: string;
};
type Question = QChoice | QSpeech;

export default function Test() {
  const navigate = useNavigate();

  const questions: Question[] = [
    { type: 'choice', question: 'What is the meaning of "improve"?', options: ['Make better','Make worse','Stay the same'], answer: 'Make better' },
    { type: 'choice', question: 'What is the opposite of "happy"?', options: ['Sad','Excited','Joyful'], answer: 'Sad' },
    { type: 'choice', question: 'Which word means "conversation"?', options: ['Talk','Walk','Run'], answer: 'Talk' },
    { type: 'speech', question: 'Say the word "apple"', answer: 'apple' },
    { type: 'speech', question: 'Say the word "banana"', answer: 'banana' },
  ];

  const [score, setScore] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userText, setUserText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [srSupported, setSrSupported] = useState<boolean | null>(null);
  const [gotResult, setGotResult] = useState(false);
  const [finished, setFinished] = useState(false);

  const total = questions.length;
  const current = questions[currentIdx];
  const progress = useMemo(() => Math.round((currentIdx / total) * 100), [currentIdx, total]);

  // 최신 점수 보존
  const scoreRef = useRef(score);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // 베스트 스코어 (로컬 저장)
  const [best, setBest] = useState<number | null>(null);
  useEffect(() => {
    const v = localStorage.getItem('test_best_score');
    if (v !== null) setBest(Number(v));
  }, []);

  const saveBest = (finalScore: number) => {
    if (best === null || finalScore > best) {
      localStorage.setItem('test_best_score', String(finalScore));
      setBest(finalScore);
    }
  };

  // 등급 계산
  const percent = useMemo(() => Math.round((score / total) * 100), [score, total]);
  const grade = useMemo(() => {
    if (percent >= 90) return 'A+';
    if (percent >= 80) return 'A';
    if (percent >= 70) return 'B';
    if (percent >= 60) return 'C';
    return 'D';
  }, [percent]);

  // SpeechRecognition
  const recogRef = useRef<any>(null);

  // 다음 문제
  const endTest = useCallback(() => {
    setFinished(true);
    saveBest(scoreRef.current);
  }, []);

  const goNext = useCallback(() => {
    setCurrentIdx(prevIdx => {
      const nextIdx = prevIdx + 1;
      if (nextIdx >= total) {
        endTest();
        return prevIdx; // 더 이상 진행 X
      }
      return nextIdx;
    });
    setUserText('');
    setGotResult(false);
  }, [total, endTest]);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSrSupported(false);
      return;
    }
    setSrSupported(true);

    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = 'en-US';
    recogRef.current = r;

    r.onresult = (event: any) => {
      const text = event?.results?.[0]?.[0]?.transcript ?? '';
      setUserText(text);
      setIsRecording(false);
      setGotResult(true);

      if (questions[currentIdx].type === 'speech') {
        const correct = text.trim().toLowerCase() === String((questions[currentIdx] as QSpeech).answer).toLowerCase();
        if (correct) setScore(prev => prev + 1);
      }
      goNext();
    };

    r.onend = () => {
      setIsRecording(false);
      if (questions[currentIdx].type === 'speech' && !gotResult) {
        goNext();
      }
    };

    r.onerror = () => {
      setIsRecording(false);
      if (questions[currentIdx].type === 'speech') goNext();
    };

    return () => {
      try {
        r.onresult = null; r.onend = null; r.onerror = null; r.stop();
      } catch {}
      recogRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  // 객관식
  const handleAnswer = (selected: string) => {
    if (current.type !== 'choice') return;
    setScore(prev => prev + (selected === current.answer ? 1 : 0));
    goNext();
  };

  // 녹음 제어
  const startRecording = () => {
    if (!recogRef.current) return;
    setIsRecording(true);
    setUserText('');
    setGotResult(false);
    try { recogRef.current.start(); } catch {}
  };
  const stopRecording = () => {
    if (!recogRef.current) return;
    setIsRecording(false);
    try { recogRef.current.stop(); } catch {}
  };

  // 다시 풀기
  const retry = () => {
    setScore(0);
    setCurrentIdx(0);
    setUserText('');
    setIsRecording(false);
    setGotResult(false);
    setFinished(false);
  };

  // ===== 렌더링 =====
  if (finished) {
    return (
      <div className="test-container">
        <div className="test-card result-card">
          {/* 축하 효과 */}
          <div className="confetti" aria-hidden />

          <h2 className="result-title">🎉 Test Completed!</h2>
          <p className="result-sub">수고했어요! 오늘의 결과예요.</p>

          {/* 원형 점수 링 */}
          <div className="score-ring" aria-label={`총점 ${percent}%`}>
            <div
              className="score-ring-fill"
              style={{ background: `conic-gradient(var(--brand) ${percent * 3.6}deg, #e9eef6 0deg)` }}
            />
            <div className="score-ring-center">
              <div className="score-ring-number">{percent}<span className="unit">%</span></div>
              <div className={`grade-badge grade-${grade.replace('+','p')}`}>{grade}</div>
            </div>
          </div>

          {/* 상세 점수 */}
          <div className="result-stats">
            <div className="stat">
              <div className="stat-label">맞은 개수</div>
              <div className="stat-value">{score}/{total}</div>
            </div>
            <div className="stat">
              <div className="stat-label">베스트</div>
              <div className="stat-value">{best ?? '-'} 점</div>
            </div>
          </div>

          {/* 액션 */}
          <div className="result-actions">
            <button className="btn ghost" onClick={() => navigate('/home')}>🏠 홈으로</button>
            <button className="btn primary" onClick={retry}>🔁 다시 풀기</button>
            <button className="btn outline" onClick={() => navigate('/my-feedback')}>📋 피드백 보기</button>
          </div>
        </div>
      </div>
    );
  }

  // 진행 중 화면
  return (
    <div className="test-container">
      <div className="test-card">
        {/* 헤더 */}
        <div className="test-header">
          <button className="back-button" onClick={() => navigate('/home')} aria-label="뒤로가기">
            &lt;
          </button>
          <h2>📝 Test</h2>
        </div>

        {/* 진행 정보 */}
        <div className="progress-row" aria-label="진행상태">
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-text">Q {currentIdx + 1}/{total}</div>
        </div>

        {/* 질문 */}
        <div className="question">{current.question}</div>

        {/* 객관식 */}
        {current.type === 'choice' && (
          <div className="options">
            {current.options.map((opt, i) => (
              <button
                key={i}
                className="option-btn"
                onClick={() => handleAnswer(opt)}
                aria-label={`Option ${i + 1}: ${opt}`}
              >
                <span>{opt}</span>
              </button>
            ))}
          </div>
        )}

        {/* 말하기 */}
        {current.type === 'speech' && (
          <div className="speech-test">
            {srSupported === false && (
              <div className="warn">
                음성 인식이 이 브라우저에서 지원되지 않아요. (Chrome 최신 권장)
              </div>
            )}

            <div className={`pill ${isRecording ? 'live' : gotResult ? 'done' : ''}`}>
              {isRecording ? '🎙️ Recording...' : gotResult ? '✅ Result captured' : '🕒 Ready'}
            </div>

            <div className="btn-row">
              <button className="record-btn" onClick={startRecording} disabled={isRecording || srSupported === false}>
                {isRecording ? 'Recording...' : 'Start Recording'}
              </button>
              <button className="stop-btn" onClick={stopRecording} disabled={!isRecording || srSupported === false}>
                Stop Recording
              </button>
              <button className="stop-btn" onClick={goNext} disabled={isRecording} title="녹음 실패 시 건너뛰기">
                Skip
              </button>
            </div>

            <div className="recognized">
              Recognized: <strong>{userText || '—'}</strong>
            </div>
          </div>
        )}

        {/* 점수 */}
        <div className="score">
          Current Score: <span className="final">{score}</span>
        </div>
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
