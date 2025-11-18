import { useNavigate } from 'react-router-dom';
import './Announcements.css';

interface Announcement {
  id: number;
  title: string;
  date: string;
  content: string;
}

const announcements: Announcement[] = [
  { id: 1, title: '서비스 업데이트 안내', date: '2025-10-10', content: '앱 최신 버전이 출시되었습니다.' },
  { id: 2, title: '점검 안내', date: '2025-10-05', content: '서버 점검으로 서비스가 일시 중단됩니다.' },
  { id: 3, title: '이벤트 안내', date: '2025-09-30', content: '가을 이벤트가 시작되었습니다.' },
];

export default function Announcements() {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);

  return (
    <div className="announcements-container">
      <header className="announcements-header">
        <button onClick={goBack} className="back-btn" aria-label="뒤로가기">←</button>
        <h2>공지사항</h2>
      </header>

      <main className="announcements-main">
        {announcements.map((item) => (
          <div key={item.id} className="announcement-card">
            <h3 className="announcement-title">{item.title}</h3>
            <span className="announcement-date">{item.date}</span>
            <p className="announcement-content">{item.content}</p>
          </div>
        ))}
      </main>
    </div>
  );
}
