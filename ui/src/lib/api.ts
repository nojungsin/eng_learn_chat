// src/lib/api.ts (새 파일)
export function getAccessToken(): string | null {
    return localStorage.getItem('accessToken'); // 로그인 시 여기에 저장되어 있어야 함
}

export async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}) {
    const token = getAccessToken();
    const headers = new Headers(init.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json'); // 필요 시

    const res = await fetch(input, { ...init, headers });
    if (res.status === 401) {
        // 세션 만료 등 공통 처리
        // 필요하면 토큰 삭제 후 로그인 페이지로 이동
        // localStorage.removeItem('accessToken');
        // window.location.replace('/login');
    }
    return res;
}
