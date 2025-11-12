# app/services/text_chat.py (예시 파일명)

from ..services.llm_client import get_model
from app.util.roleplay_chain import create_initial_prompt, create_roleplay_chain
import re
from typing import Dict, List

# ---------------------------------------------
# 유틸
# ---------------------------------------------
_POS_KW = ['완벽', '자연', '좋', '적절', '문제 없음', '괜찮', '정확', '올바르']
_NEG_KW = ['어색', '부자연', '수정', '개선', '문제', '애매', '불분명', '오류', '틀림']

def _normalize_feedback_format(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = re.sub(r'\bSuggestion\b\s*[:\-]', 'suggestion:', text, flags=re.I)
    text = re.sub(r'\bGrammar\b\s*[:\-]', 'grammar:', text, flags=re.I)
    text = re.sub(r'\bVocabulary\b\s*[:\-]', 'vocabulary:', text, flags=re.I)
    text = re.sub(r'(\S)\n{0,1}suggestion:', r'\1\n\nsuggestion:', text)
    return text

def _polarity(text: str) -> int:
    t = text.lower()
    pos = any(k in t for k in _POS_KW)
    neg = any(k in t for k in _NEG_KW)
    if pos and not neg: return 1
    if neg and not pos: return -1
    return 0

def _candidate_lines_from_suggestion(sugg: str) -> List[str]:
    lines = []
    for ln in sugg.splitlines():
        ln = ln.strip()
        if not ln: continue
        ln = re.sub(r'^\d+\.\s*', '', ln)
        ln = re.sub(r'^(hi|hello|hey)[!,.]?\s*', '', ln, flags=re.I)
        lines.append(ln)
    lines.sort(key=lambda s: abs(len(s.split()) - 9))
    return lines

def _tokenize(s: str) -> List[str]:
    return re.findall(r'\b[a-z]+\b', s.lower())

def _extract_sections(ai_output: str):
    """grammar / vocabulary / suggestion 분리 추출"""
    gram = re.search(
        r'(?i)grammar\s*[:\-]\s*([\s\S]*?)(?=\n\s*vocabulary\s*[:\-]|\n\s*suggestion\s*[:\-]|$)',
        ai_output
    )
    voca = re.search(
        r'(?i)vocabulary\s*[:\-]\s*([\s\S]*?)(?=\n\s*suggestion\s*[:\-]|$)',
        ai_output
    )
    sugg = re.search(r'(?i)suggestion\s*[:\-]\s*([\s\S]*)', ai_output)
    g_txt = gram.group(1).strip() if gram else ''
    v_txt = voca.group(1).strip() if voca else ''
    s_txt = sugg.group(1).strip() if sugg else ''
    return g_txt, v_txt, s_txt

def _categories_from_sections(g_txt: str, v_txt: str) -> List[str]:
    cats: List[str] = []
    if _polarity(g_txt) == -1: cats.append('GRAMMAR')
    if _polarity(v_txt) == -1: cats.append('VOCABULARY')
    return cats

def calculate_similarity_score(user_message: str, ai_output: str) -> int:
    ai_output = _normalize_feedback_format(ai_output or "")
    _, _, suggestion_text = _extract_sections(ai_output)

    uw = set(_tokenize(user_message or ""))
    best = 0.0
    if uw and suggestion_text:
        for cand in _candidate_lines_from_suggestion(suggestion_text):
            sw = set(_tokenize(cand))
            if not sw: continue
            inter = len(uw & sw); union = len(uw | sw)
            j = inter / union if union else 0.0
            best = max(best, j)

    score = int(round(best * 100))
    g_txt, v_txt, _ = _extract_sections(ai_output)
    g_pol = _polarity(g_txt); v_pol = _polarity(v_txt)

    if g_pol == 1 and v_pol == 1:
        score = max(score, 90)
        if not suggestion_text or re.search(r'(no\s+change|looks\s+good|fine|perfect)', suggestion_text, re.I):
            score = max(score, 95)
    elif g_pol == -1 or v_pol == -1:
        score = min(score, 60)
    else:
        if not suggestion_text:
            score = max(score, 75 if uw else 50)

    return max(15, min(100, score))

def _level_by_score(score: int) -> str:
    # 백엔드 보관용(문자열): 'excellent' | 'good' | 'needs-work'
    if score >= 90: return 'excellent'
    if score >= 75: return 'good'
    return 'needs-work'

# ---------------------------------------------
# 초기 인사
# ---------------------------------------------
async def start_chat_service(data: Dict):
    topic = data.get("topic", "hospital")
    ai_role = data.get("ai_role", "doctor")
    user_role = data.get("user_role", "patient")
    prompt = create_initial_prompt(topic, ai_role, user_role)
    model = get_model()
    response = model.invoke(prompt)
    reply = _normalize_feedback_format(getattr(response, "content", str(response)))
    return {"reply": reply}

# ---------------------------------------------
# 사용자 메시지 전송 + 점수/카테고리/섹션 반환
# ---------------------------------------------
async def send_message_service(data: Dict):
    topic = data.get("topic")
    ai_role = data.get("ai_role")
    user_role = data.get("user_role")
    user_message = data.get("message", "")

    chain = create_roleplay_chain()
    result = chain.invoke({
        "topic": topic, "ai_role": ai_role, "user_role": user_role,
        "user_message": user_message
    })

    reply_text = getattr(result, "content", str(result))
    reply_text = _normalize_feedback_format(reply_text)

    score = calculate_similarity_score(user_message, reply_text)
    level = _level_by_score(score)

    g_txt, v_txt, s_txt = _extract_sections(reply_text)
    categories = _categories_from_sections(g_txt, v_txt)

    # [AI Reply]/[Feedback] 포맷은 유지(프론트에서 파싱 가능)
    return {
        "reply": reply_text,
        "score": score,
        "level": level,
        "categories": categories,            # ex) ["GRAMMAR"] or []
        "grammar": g_txt,                    # 빈 문자열 가능
        "vocabulary": v_txt,                 # 빈 문자열 가능
        "suggestion": s_txt,                 # 빈 문자열 가능
        # "voca": [{ "word": "prescription", "meaningKo": "...", "example": "..." }, ...]  # 있으면 추가
    }
