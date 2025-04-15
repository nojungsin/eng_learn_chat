import { useState } from 'react';
import './Mypage.css'; // CSS 파일 추가

export default function Mypage() {
  // 피드백 데이터
  const [feedback, setFeedback] = useState<{ topic: string; message: string }[]>([
    {
      topic: 'Grammar',
      message: '문법에 대한 피드백: 문법적 오류가 조금 있었습니다.',
    },
    {
      topic: 'Vocabulary',
      message: '단어 사용이 적절했습니다. 더 많은 예시가 필요합니다.',
    },
    {
      topic: 'Conversation',
      message: '대화 흐름은 자연스러웠습니다. 발음 연습이 필요합니다.',
    },
  ]);

  return (
    <div className="mypage-container">
      <div className="mypage-card">
        <h2>👤 마이페이지</h2>
        <h3>내 피드백</h3>
        {feedback.length === 0 ? (
          <p>아직 피드백이 없습니다.</p>
        ) : (
          <ul className="feedback-list">
            {feedback.map((item, index) => (
              <li key={index} className="feedback-item">
                <h4>{item.topic}</h4>
                <p>{item.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
