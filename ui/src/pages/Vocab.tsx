import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Vocab.css";

type Vocabulary = {
    vocaid: number;
    word: string;
    kmeaning: string;
    example?: string;
    known: boolean;
};

type ApiError = { message?: string };

const getToken = (): string | null =>
    localStorage.getItem("accessToken") ??
    localStorage.getItem("token") ??
    localStorage.getItem("accesstoken");

// 항상 Headers 객체를 반환
const authHeaders = (): Headers => {
    const h = new Headers();
    const t = getToken();
    if (t) h.set("Authorization", `Bearer ${t}`);
    h.set("Accept", "application/json");
    return h;
};

// JSON 요청용 헤더 (Content-Type 추가)
const jsonHeaders = (): Headers => {
    const h = authHeaders();
    h.set("Content-Type", "application/json");
    return h;
};

async function fetchJSON<T = any>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    if (res.ok) {
        // 204 등 비어있는 응답 대비
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) return (await res.json()) as T;
        return {} as T;
    }

    let errMsg = `HTTP ${res.status}`;
    try {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
            const data = (await res.json()) as ApiError;
            if (data?.message) errMsg = data.message;
        } else {
            const txt = await res.text();
            if (txt) errMsg = txt;
        }
    } catch {}

    const e = new Error(errMsg) as Error & { status?: number };
    e.status = res.status;
    throw e;
}

export default function Vocab() {
    const nav = useNavigate();

    const [words, setWords] = useState<Vocabulary[]>([]);
    const [newWord, setNewWord] = useState("");
    const [newKMeaning, setNewKMeaning] = useState("");
    const [newExample, setNewExample] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 초기 로드
    useEffect(() => {
        (async () => {
            const token = getToken();
            if (!token) {
                nav("/login");
                return;
            }

            try {
                // 세션 검증
                await fetchJSON("/api/auth/me", { headers: authHeaders() });
                // 단어 목록
                const data = await fetchJSON<Vocabulary[]>("/api/voca", {
                    headers: authHeaders(),
                });
                setWords(data);
            } catch (e: any) {
                if (e?.status === 401) nav("/login");
                else setError(e?.message || "단어 목록을 불러오지 못했어요.");
            } finally {
                setLoading(false);
            }
        })();
    }, [nav]);

    const resetForm = () => {
        setNewWord("");
        setNewKMeaning("");
        setNewExample("");
    };

    const onAdd = async () => {
        const w = newWord.trim();
        const m = newKMeaning.trim();
        const ex = newExample.trim();
        if (!w || !m) {
            setError("단어와 뜻을 입력해 주세요.");
            return;
        }
        setError(null);
        try {
            const created = await fetchJSON<Vocabulary>("/api/voca", {
                method: "POST",
                headers: jsonHeaders(),
                body: JSON.stringify({ word: w, kmeaning: m, example: ex }),
            });
            setWords((prev) => [created, ...prev]);
            resetForm();
        } catch (e: any) {
            if (e?.status === 401) nav("/login");
            else setError(e?.message || "저장에 실패했습니다.");
        }
    };

    const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onAdd();
        }
    };

    const toggleKnown = async (index: number) => {
        const item = words[index];
        try {
            const updated = await fetchJSON<Vocabulary>(`/api/voca/${item.vocaid}`, {
                method: "PATCH",
                headers: jsonHeaders(),
                body: JSON.stringify({ known: !item.known }),
            });
            setWords((prev) => prev.map((w, i) => (i === index ? updated : w)));
        } catch (e: any) {
            if (e?.status === 401) nav("/login");
            else setError(e?.message || "체크 상태 변경에 실패했습니다.");
        }
    };

    const onDelete = async (index: number) => {
        const vocaid = words[index].vocaid;
        try {
            const r = await fetch(`/api/voca/${vocaid}`, {
                method: "DELETE",
                headers: authHeaders(),
            });
            if (!r.ok) {
                let msg = `HTTP ${r.status}`;
                try {
                    const ct = r.headers.get("content-type") || "";
                    if (ct.includes("application/json")) {
                        const j = (await r.json()) as ApiError;
                        if (j?.message) msg = j.message;
                    } else {
                        const txt = await r.text();
                        if (txt) msg = txt || msg;
                    }
                } catch {}
                const e = new Error(msg) as Error & { status?: number };
                e.status = r.status;
                throw e;
            }
            setWords((prev) => prev.filter((_, i) => i !== index));
        } catch (e: any) {
            if (e?.status === 401) nav("/login");
            else setError(e?.message || "삭제에 실패했습니다.");
        }
    };

    return (
        <div className="vocab-container">
            <div className="vocab-box">
                <div className="vocab-header">
                    <h2>📚 단어장</h2>
                    <button
                        type="button"
                        className="close-button"
                        aria-label="닫기"
                        onClick={() => nav(-1)}
                    >
                        ×
                    </button>
                </div>

                <div className="vocab-form">
                    <input
                        className="vocab-input"
                        placeholder="단어 (예: appreciate)"
                        value={newWord}
                        onChange={(e) => setNewWord(e.target.value)}
                        onKeyDown={onKeyDown}
                    />
                    <input
                        className="vocab-input"
                        placeholder="뜻 (예: 고맙게 여기다)"
                        value={newKMeaning}
                        onChange={(e) => setNewKMeaning(e.target.value)}
                        onKeyDown={onKeyDown}
                    />
                    <input
                        className="vocab-input"
                        placeholder="예문 (선택)"
                        value={newExample}
                        onChange={(e) => setNewExample(e.target.value)}
                        onKeyDown={onKeyDown}
                    />
                    <button className="add-btn" onClick={onAdd}>
                        추가
                    </button>
                </div>

                {error && <p className="form-error">{error}</p>}
                {loading ? (
                    <p>불러오는 중…</p>
                ) : words.length === 0 ? (
                    <p>저장된 단어가 없습니다.</p>
                ) : (
                    <ul className="vocab-list">
                        {words.map((w, i) => (
                            <li key={w.vocaid} className={`vocab-item ${w.known ? "known" : ""}`}>
                                <div className="vocab-top-row">
                                    <h3>{w.word}</h3>
                                    <div className="vocab-actions">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={w.known}
                                                onChange={() => toggleKnown(i)}
                                            />
                                            <span className="checkbox-label">아는 단어</span>
                                        </label>
                                        <button className="delete-btn" onClick={() => onDelete(i)}>
                                            삭제
                                        </button>
                                    </div>
                                </div>
                                <p>📖 뜻: {w.kmeaning}</p>
                                {w.example && <p>✏️ 예문: {w.example}</p>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
