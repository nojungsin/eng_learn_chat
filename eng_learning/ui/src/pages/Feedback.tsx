import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Feedback.css';

export default function Feedback() {
  const [feedbackList] = useState<{ topic: string; feedback: string }[]>([
    {
      topic: 'Grammar',
      feedback: '문법에 대한 피드백: 문법적 오류가 조금 있었습니다.',
    },
    {
      topic: 'Vocabulary',
      feedback: '단어 사용이 적절했습니다. 더 많은 예시가 필요합니다.',
    },
    {
      topic: 'Conversation',
      feedback: '대화 흐름은 자연스러웠습니다. 발음 연습이 필요합니다.',
    },
  ]);

  const navigate = useNavigate();

  return (
      <div className="feedback-container">
        <div className="feedback-card">
          <div className="feedback-header">
            <button className="back-button" onClick={() => navigate('/home')}>
              &lt;
            </button>
            <h2>💬 피드백</h2>
          </div>

          <h3>사용자 피드백</h3>

          {feedbackList.length === 0 ? (
              <p>아직 피드백이 없습니다.</p>
          ) : (
              <ul className="feedback-list">
                {feedbackList.map((item, index) => (
                    <li key={index} className="feedback-item">
                      <h4>{item.topic}</h4>
                      <p>{item.feedback}</p>
                    </li>
                ))}
              </ul>
          )}
        </div>
      </div>
  );
}