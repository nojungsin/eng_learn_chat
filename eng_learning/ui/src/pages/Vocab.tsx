import { useState } from 'react';
import './Vocab.css'; // ✅ CSS 추가

type VocabWord = {
  word: string;
  meaning: string;
  example: string;
};

export default function Vocab() {
  const [words, setWords] = useState<VocabWord[]>([
    {
      word: 'improve',
      meaning: 'to make better',
      example: 'I want to improve my English.',
    },
    {
      word: 'conversation',
      meaning: 'talking with someone',
      example: 'We had a nice conversation at lunch.',
    },
  ]);

  return (
    <div className="vocab-container">
      <div className="vocab-box">
        <h2>📚 단어장</h2>
        {words.length === 0 ? (
          <p>저장된 단어가 없습니다.</p>
        ) : (
          <ul className="vocab-list">
            {words.map((w, i) => (
              <li key={i} className="vocab-item">
                <h3>{w.word}</h3>
                <p>📖 뜻: {w.meaning}</p>
                <p>✏️ 예문: {w.example}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
