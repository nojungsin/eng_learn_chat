import { useNavigate } from 'react-router-dom';
import './Choose.css';

export default function Choose() {
  const navigate = useNavigate();

  const go = (to: string) => () => navigate(to);
  const onKeyActivate =
    (to: string) =>
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(to);
      }
    };

  return (
    <div className="choose-container">
      <button
        className="choose-back"
        aria-label="홈으로"
        onClick={go('/home')}
      >
        ←
      </button>

      <div className="choose-card">
        <header className="choose-header">
          <h2>💬 채팅 모드를 선택하세요</h2>
          <p className="choose-sub">원하는 방식으로 영어 연습을 시작해요.</p>
        </header>

        <div className="choose-grid" role="listbox" aria-label="채팅 모드">
          {/* 텍스트 모드 */}
          <div
            className="choose-item"
            role="option"
            tabIndex={0}
            onClick={go('/text')}
            onKeyDown={onKeyActivate('/text')}
            aria-label="텍스트 채팅으로 이동"
          >
            <div className="choose-icon" aria-hidden>💬</div>
            <div className="choose-body">
              <div className="choose-title">텍스트 채팅</div>
              <div className="choose-desc">키보드로 주고받는 대화 — 문장/표현 연습에 좋아요.</div>
            </div>
            <div className="choose-chevron" aria-hidden>›</div>
          </div>

          {/* 음성 모드 */}
          <div
            className="choose-item"
            role="option"
            tabIndex={0}
            onClick={go('/voice')}
            onKeyDown={onKeyActivate('/voice')}
            aria-label="음성 채팅으로 이동"
          >
            <div className="choose-icon" aria-hidden>🎤</div>
            <div className="choose-body">
              <div className="choose-title">음성 채팅</div>
              <div className="choose-desc">마이크로 말하고 듣기 — 발음/억양 실전 감각 업!</div>
            </div>
            <div className="choose-chevron" aria-hidden>›</div>
          </div>
        </div>


      </div>
    </div>
  );
}
