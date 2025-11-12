import { useNavigate } from 'react-router-dom';
import './Service.css';

export default function Service() {
  const navigate = useNavigate();
  const goBack = () => navigate(-1); // 뒤로가기 버튼

  return (
    <div className="service-container">
      <header className="service-header">
        <button onClick={goBack} className="back-btn" aria-label="뒤로가기">←</button>
        <h2>문의/도움 받기</h2>
      </header>

      <main className="service-main">
        <section className="contact-info">
          <h3>연락 방법</h3>
          <p>이메일: hye@gmail.com/ jaeyun2124@naver.com</p>
          <p>전화: 010-1234-5678</p>
        </section>

        <section className="faq-link">
          <h3>자주 묻는 질문</h3>
          <button onClick={() => navigate('/faq')} className="faq-btn">
            FAQ 보러가기
          </button>
        </section>


      </main>
    </div>
  );
}
