import { useNavigate } from 'react-router-dom';
import './Mypage.css';
import React, { useEffect, useState } from 'react';

type MeResponse =
    | {
    // 흔한 형태 1
    username?: string;
    name?: string;
    email?: string;
    user?: { username?: string; email?: string };
    success?: boolean;
    message?: string;
}
    | {
    // 흔한 형태 2 (토큰만 다시 내려주는 타입)
    success?: boolean;
    message?: string;
    accesstoken?: string;
    token?: string;
}
    | Record<string, any>;

function getToken(): string | null {
    return (
        localStorage.getItem('accessToken') ??
        localStorage.getItem('token') ??
        localStorage.getItem('accesstoken')
    );
}

export default function Mypage() {
    const navigate = useNavigate();
    const go =
        (to: string) =>
            () =>
                navigate(to);

    const onKeyActivate =
        (to: string) =>
            (e: React.KeyboardEvent<HTMLDivElement>) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(to);
                }
            };

    // 화면에 띄울 사용자 정보들
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string>('');

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const t = getToken();
        if (!t) {
            setLoading(false);
            setErrorMsg('로그인이 필요합니다.');
            return;
        }

        const ctrl = new AbortController();

        (async () => {
            try {
                const res = await fetch('/api/auth/me', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${t}`,
                        Accept: 'application/json',
                    },
                    signal: ctrl.signal,
                });

                if (!res.ok) {
                    setErrorMsg(`프로필 조회 실패 (HTTP ${res.status})`);
                    setLoading(false);
                    return;
                }

                const me: MeResponse = await res.json();

                // 다양한 스키마 대응
                const uname =
                    (me as any).username ??
                    (me as any).name ??
                    (me as any).user?.username ??
                    '';
                const mail =
                    (me as any).email ??
                    (me as any).user?.email ??
                    '';

                setUsername(uname ?? '');
                setEmail(mail ?? '');
                setLoading(false);
            } catch (err: any) {
                if (err?.name === 'AbortError') return;
                console.error(err);
                setErrorMsg('프로필 요청 중 오류가 발생했습니다.');
                setLoading(false);
            }
        })();

        return () => ctrl.abort();
    }, []);

    return (
        <div className="mypage-container">
            <div className="profile-header">
                <div className="profile-avatar" aria-hidden>
                    👤
                </div>

                <div className="profile-info">
                    {loading ? (
                        <>
                            <h2>불러오는 중…</h2>
                            <p>잠시만 기다려주세요</p>
                        </>
                    ) : (
                        <>
                            <h2>{username || '게스트'}</h2>
                            <p>{email || '—'}</p>
                            {errorMsg && (
                                <p
                                    role="alert"
                                    style={{ marginTop: 8, fontSize: 14, opacity: 0.8 }}
                                >
                                    {errorMsg}
                                </p>
                            )}
                        </>
                    )}
                </div>

                <button
                    onClick={go('/home')}
                    className="login-btn"
                    aria-label="홈으로 이동"
                >
                    🏠 Home
                </button>
            </div>

            <div className="menu-list" role="menu" aria-label="마이페이지 메뉴">
                <div
                    className="menu-item"
                    role="menuitem"
                    tabIndex={0}
                    onClick={go('/achievement')}
                    onKeyDown={onKeyActivate('/achievement')}
                >
                    <span className="menu-icon">📋</span>
                    <div className="menu-texts">
                        <span className="menu-text">학습 지표</span>
                        <span className="menu-sub">나의 학습 성취도 보기</span>
                    </div>
                    <span className="menu-chevron" aria-hidden>
            ›
          </span>
                </div>

                <div
                    className="menu-item"
                    role="menuitem"
                    tabIndex={0}
                    onClick={go('/service')}
                    onKeyDown={onKeyActivate('/service')}
                >
                    <span className="menu-icon">📞</span>
                    <div className="menu-texts">
                        <span className="menu-text">Customer service</span>
                        <span className="menu-sub">문의/도움 받기</span>
                    </div>
                    <span className="menu-chevron" aria-hidden>
            ›
          </span>
                </div>

                <div
                    className="menu-item"
                    role="menuitem"
                    tabIndex={0}
                    onClick={go('/sgfbcm')}
                    onKeyDown={onKeyActivate('/sgfbcm')}
                >
                    <span className="menu-icon">📝</span>
                    <div className="menu-texts">
                        <span className="menu-text">Suggested feedback</span>
                        <span className="menu-sub">추천 코멘트 확인</span>
                    </div>
                    <span className="menu-chevron" aria-hidden>
            ›
          </span>
                </div>

                <div
                    className="menu-item"
                    role="menuitem"
                    tabIndex={0}
                    onClick={go('/personaldata')}
                    onKeyDown={onKeyActivate('/personaldata')}
                >
                    <span className="menu-icon">🔐</span>
                    <div className="menu-texts">
                        <span className="menu-text">Personal data</span>
                        <span className="menu-sub">내 정보 관리</span>
                    </div>
                    <span className="menu-chevron" aria-hidden>
            ›
          </span>
                </div>

                <div
                    className="menu-item"
                    role="menuitem"
                    tabIndex={0}
                    onClick={go('/announcements')}
                    onKeyDown={onKeyActivate('/announcements')}
                >
                    <span className="menu-icon">📢</span>
                    <div className="menu-texts">
                        <span className="menu-text">공지사항</span>
                        <span className="menu-sub">업데이트/알림</span>
                    </div>
                    <span className="menu-chevron" aria-hidden>
            ›
          </span>
                </div>

                <div
                    className="menu-item"
                    role="menuitem"
                    tabIndex={0}
                    onClick={go('/faq')}
                    onKeyDown={onKeyActivate('/faq')}
                >
                    <span className="menu-icon">❓</span>
                    <div className="menu-texts">
                        <span className="menu-text">FAQ</span>
                        <span className="menu-sub">자주 묻는 질문</span>
                    </div>
                    <span className="menu-chevron" aria-hidden>
            ›
          </span>
                </div>
            </div>
        </div>
    );
}
