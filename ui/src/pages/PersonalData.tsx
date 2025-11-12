import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PersonalData.css';

type UserData = { name: string; email: string; password: string };

export default function PersonalData() {
    const navigate = useNavigate();
    const goBack = () => navigate(-1);

    const [userData, setUserData] = useState<UserData>({ name: '', email: '', password: '' });
    const [original, setOriginal] = useState<{ name: string; email: string }>({ name: '', email: '' });

    // 내 정보 불러오기
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (r) => {
                const data = await r.json();
                if (!r.ok) throw new Error(data?.message || '내 정보를 불러오지 못했습니다.');

                // 백엔드: { username, name, email } 구조
                const name = data.name ?? data.username ?? '';
                const email = data.email ?? '';

                setUserData({ name, email, password: '' });
                setOriginal({ name, email });
            })
            .catch((err) => {
                alert(err.message);
            });
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // 바뀐 값만 body에 담아 전송
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        const body: Record<string, string> = {};
        if (userData.name.trim() !== original.name.trim()) body.name = userData.name.trim();
        if (userData.email.trim() !== original.email.trim()) body.email = userData.email.trim();
        if (userData.password.trim() !== '') body.password = userData.password;

        if (Object.keys(body).length === 0) {
            alert('변경된 내용이 없습니다.');
            return;
        }

        fetch('/api/auth/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        })
            .then(async (r) => {
                const data = await r.json().catch(() => ({}));
                if (!r.ok) throw new Error(data?.message || '수정 실패');

                alert(data?.message || '저장되었습니다.');

                // 성공 시 비밀번호는 비우고, 변경된 항목만 원본 갱신
                setUserData(prev => ({ ...prev, password: '' }));
                setOriginal(prev => ({
                    name: body.name ?? prev.name,
                    email: body.email ?? prev.email,
                }));
            })
            .catch((err) => {
                alert(err.message);
            });
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

                    <button type="submit" className="save-btn">저장하기</button>
                </form>
            </main>
        </div>
    );
}
