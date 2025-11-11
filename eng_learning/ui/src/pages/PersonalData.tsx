import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PersonalData.css';

type Profile = {
  username: string;
  email: string;
  // password는 서버에서 내려주지 않음
};

type FormState = {
  username: string;
  email: string;
  password: string; // 항상 빈 값으로 시작, 입력 시에만 전송
};

export default function PersonalData() {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);

  const [form, setForm] = useState<FormState>({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 최초 로드 시 서버에서 username/email 가져오기
  const initialRef = useRef<Profile | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('accessToken'); // 로그인 시 저장해둔 JWT
        const res = await fetch('/api/users/me', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          alert('로그인이 필요합니다.');
          navigate('/login');
          return;
        }

        const data = await res.json();
        initialRef.current = { username: data.username, email: data.email };
        setForm({ username: data.username, email: data.email, password: '' });
      } catch (e) {
        setError('내 정보 조회에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  const handleChange = (
      e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // 어떤 필드가 변경되었는지 비교해서 payload 만들기
  const buildDiffPayload = () => {
    const payload: Partial<FormState> = {};
    const initial = initialRef.current;

    if (!initial) return payload;

    if (form.username !== initial.username) payload.username = form.username;
    if (form.email !== initial.email) payload.email = form.email;
    if (form.password.trim().length > 0) payload.password = form.password;

    return payload;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const diff = buildDiffPayload();
    const hasChanges = Object.keys(diff).length > 0;

    if (!hasChanges) {
      alert('변경된 내용이 없습니다.');
      return;
    }

    try {
      setSaving(true);
      // 토큰 읽기
      const token = localStorage.getItem('token'); // ★ 키 통일

      const res = await fetch('/api/users/me', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}), // ★ 헤더로 전송
        },
      });


      if (!res.ok) {
        const msg = await safeErrorMessage(res);
        throw new Error(msg || '저장에 실패했습니다.');
      }

      // 서버가 최신 프로필을 반환한다고 가정
      const updated: Profile = await res.json();

      // 초기값을 갱신해주어야 이후 diff가 정확해짐
      initialRef.current = {
        username: updated.username,
        email: updated.email,
      };
      setForm(prev => ({
        username: updated.username,
        email: updated.email,
        password: '', // 비밀번호 입력 칸은 항상 비움
      }));

      alert('내 정보가 저장되었습니다!');
    } catch (e: any) {
      setError(e.message ?? '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const hasAnyChange = (() => {
    const initial = initialRef.current;
    if (!initial) return false;
    return (
        form.username !== initial.username ||
        form.email !== initial.email ||
        form.password.trim().length > 0
    );
  })();

  if (loading) {
    return (
        <div className="personal-container">
          <header className="personal-header">
            <button onClick={goBack} className="back-btn" aria-label="뒤로가기">←</button>
            <h2>내 정보 관리</h2>
          </header>
          <main className="personal-main">
            <p>불러오는 중...</p>
          </main>
        </div>
    );
  }

  return (
      <div className="personal-container">
        <header className="personal-header">
          <button onClick={goBack} className="back-btn" aria-label="뒤로가기">←</button>
          <h2>내 정보 관리</h2>
        </header>

        <main className="personal-main">
          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="personal-field">
              <label htmlFor="username">사용자명</label>
              <input
                  type="text"
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
              />
            </div>

            <div className="personal-field">
              <label htmlFor="email">이메일</label>
              <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
              />
            </div>

            <div className="personal-field">
              <label htmlFor="password">비밀번호 변경</label>
              <input
                  type="password"
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="새 비밀번호를 입력하세요 (미입력 시 변경 없음)"
              />
            </div>

            <button
                type="submit"
                className="save-btn"
                disabled={!hasAnyChange || saving}
            >
              {saving ? '저장 중…' : '저장하기'}
            </button>
          </form>
        </main>
      </div>
  );
}

/** 오류 메시지 안전 파싱 */
async function safeErrorMessage(res: Response) {
  try {
    const data = await res.json();
    return data?.message || data?.error || '';
  } catch {
    return '';
  }
}
