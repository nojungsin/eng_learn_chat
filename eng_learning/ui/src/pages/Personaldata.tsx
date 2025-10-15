import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Personaldata.css';

export default function PersonalData() {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);

  // 예시 사용자 정보 (실제 앱에서는 API로 가져오고 저장)
  const [userData, setUserData] = useState({
    name: '홍길동',
    email: 'hong@example.com',
    phone: '010-1234-5678',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert('내 정보가 저장되었습니다!');
    // 실제 서버 연동 시 API 호출
  };

  return (
    <div className="personal-container">
      <header className="personal-header">
        <button onClick={goBack} className="back-btn" aria-label="뒤로가기">←</button>
        <h2>내 정보 관리</h2>
      </header>

      <main className="personal-main">
        <form onSubmit={handleSubmit}>
          <div className="personal-field">
            <label htmlFor="name">이름</label>
            <input type="text" id="name" name="name" value={userData.name} onChange={handleChange} required />
          </div>
          <div className="personal-field">
            <label htmlFor="email">이메일</label>
            <input type="email" id="email" name="email" value={userData.email} onChange={handleChange} required />
          </div>
          <div className="personal-field">
            <label htmlFor="phone">전화번호</label>
            <input type="text" id="phone" name="phone" value={userData.phone} onChange={handleChange} />
          </div>
          <button type="submit" className="save-btn">저장하기</button>
        </form>
      </main>
    </div>
  );
}
