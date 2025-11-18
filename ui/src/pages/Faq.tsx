import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Faq.css';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  { id: 1, question: '회원가입은 어떻게 하나요?', answer: '홈 화면에서 회원가입 버튼을 눌러 진행하실 수 있습니다.' },
  { id: 2, question: '비밀번호를 잊어버렸어요.', answer: '로그인 화면에서 비밀번호 재설정 링크를 클릭하세요.' },
  { id: 3, question: '문의는 어디서 할 수 있나요?', answer: '마이페이지 → 문의/도움 받기에서 문의하실 수 있습니다.' },
];

export default function Faq() {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);

  const [openId, setOpenId] = useState<number | null>(null);

  const toggleAnswer = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="faq-container">
      <header className="faq-header">
        <button onClick={goBack} className="back-btn" aria-label="뒤로가기">←</button>
        <h2>FAQ</h2>
      </header>

      <main className="faq-main">
        {faqs.map((item) => (
          <div key={item.id} className="faq-card">
            <div
              className="faq-question"
              onClick={() => toggleAnswer(item.id)}
              tabIndex={0}
              onKeyDown={(e) => { if(e.key === 'Enter') toggleAnswer(item.id); }}
            >
              {item.question}
              <span className="faq-toggle">{openId === item.id ? '▲' : '▼'}</span>
            </div>
            {openId === item.id && <div className="faq-answer">{item.answer}</div>}
          </div>
        ))}
      </main>
    </div>
  );
}
