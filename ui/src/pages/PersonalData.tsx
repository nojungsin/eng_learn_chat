import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PersonalData.css';

type MeResponse = {
    username?: string;
    name?: string;
    email?: string;
    user?: { username?: string; email?: string };
    success?: boolean;
    message?: string;
    accessToken?: string;
    accesstoken?: string;
    token?: string;
} & Record<string, any>;

type UserData = { name: string; email: string; password: string };

function getToken(): string | null {
    return (
        localStorage.getItem('accessToken') ??
        localStorage.getItem('token') ??
        localStorage.getItem('accesstoken')
    );
}

function setTokenIfPresent(obj: any) {
    const newTok = obj?.accessToken ?? obj?.token ?? obj?.accesstoken;
    if (typeof newTok === 'string' && newTok.length > 0) {
        localStorage.setItem('accessToken', newTok);
    }
}

export default function PersonalData() {
    const navigate = useNavigate();
    const goBack = () => navigate(-1);

    const [userData, setUserData] = useState<UserData>({
        name: '',
        email: '',
        password: '',
    });
    const [original, setOriginal] = useState<{ name: string; email: string }>({
        name: '',
        email: '',
    });
    const [loading, setLoading] = useState<boolean>(true);

    // 내 정보 불러오기
    useEffect(() => {
        const t = getToken();
        if (!t) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        const ctrl = new AbortController();

        (async () => {
            try {
                const r = await fetch('/api/auth/me', {
                    headers: {
                        Authorization: `Bearer ${t}`,
                        Accept: 'application/json',
                    },
                    signal: ctrl.signal,
                });

                if (r.status === 401) {
                    alert('세션이 만료되었습니다. 다시 로그인해주세요.');
                    navigate('/login');
                    return;
                }
                const data: MeResponse = await r.json().catch(() => ({}));
                if (!r.ok) throw new Error(data?.message || '내 정보를 불러오지 못했습니다.');

                const name =
                    data.name ??
                    data.username ??
                    data.user?.username ??
                    '';
                const email = data.email ?? data.user?.email ?? '';

                setUserData({ name, email, password: '' });
                setOriginal({ name, email });
            } catch (err: any) {
                if (err?.name !== 'AbortError') {
                    alert(err.message || '프로필 요청 오류');
                }
            } finally {
                setLoading(false);
            }
        })();

        return () => ctrl.abort();
        // navigate는 의존성에서 제외(불필요 재요청 방지)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // 바뀐 값만 body에 담아 전송
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const t = getToken();
        if (!t) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        const body: Record<string, string> = {};
        const trimmedName = userData.name.trim();
        const trimmedEmail = userData.email.trim();
        if (trimmedName !== original.name.trim()) body.name = trimmedName;
        if (trimmedEmail !== original.email.trim()) body.email = trimmedEmail;
        if (userData.password.trim() !== '') body.password = userData.password;

        if (Object.keys(body).length === 0) {
            alert('변경된 내용이 없습니다.');
            return;
        }

        try {
            const r = await fetch('/api/auth/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${t}`,
                    Accept: 'application/json',
                },
                body: JSON.stringify(body),
            });

            // 일부 서버는 빈 바디를 줄 수 있어 안전 파싱
            const data: MeResponse = await r.json().catch(() => ({}));

            if (r.status === 401) {
                alert('세션이 만료되었습니다. 다시 로그인해주세요.');
                navigate('/login');
                return;
            }
            if (!r.ok) {
                throw new Error(data?.message || '수정 실패');
            }

            // 서버가 새 토큰을 내려주면 교체
            setTokenIfPresent(data);

            alert(data?.message || '저장되었습니다.');

            // 성공 시 비밀번호는 비우고, 변경된 항목만 원본 갱신
            setUserData((prev) => ({ ...prev, password: '' }));
            setOriginal((prev) => ({
                name: body.name ?? prev.name,
                email: body.email ?? prev.email,
            }));
        } catch (err: any) {
            alert(err.message || '수정 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="personal-container">
            <header className="personal-header">
                <button onClick={goBack} className="back-btn" aria-label="뒤로가기">
                    ←
                </button>
                <h2>내 정보 관리</h2>
            </header>

            <main className="personal-main">
                {loading ? (
                    <p style={{ opacity: 0.8 }}>불러오는 중…</p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="personal-field">
                            <label htmlFor="name">이름</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={userData.name}
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
                                value={userData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="personal-field">
                            <label htmlFor="password">비밀번호</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={userData.password}
                                onChange={handleChange}
                                placeholder="새 비밀번호(미입력 시 변경 안 함)"
                            />
                        </div>

                        <button type="submit" className="save-btn">
                            저장하기
                        </button>
                    </form>
                )}
            </main>
        </div>
    );
}
