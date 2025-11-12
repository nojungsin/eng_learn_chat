from ..services.llm_client import get_model
from app.util.roleplay_chain import create_initial_prompt, create_roleplay_chain
import re
from typing import Dict, List

# -------------------------------------------------
# 응답 포맷 정규화
# -------------------------------------------------
def _normalize_feedback_format(text: str) -> str:
    """
    모델이 내는 키들의 대소문자/개행 변형을 흡수해
    아래 정규식들이 안정적으로 매칭되도록 맞춘다.
    - Grammar:  -> grammar:
    - Vocabulary: -> vocabulary:
    - Suggestion: -> suggestion:
    - suggestion: 앞에는 빈 줄 2개 보장
    - 'Grammar -', 'Vocabulary -' 같은 변종도 커버
    """
    if not isinstance(text, str):
        return ""

    # 키워드 소문자 통일
    text = re.sub(r'\bSuggestion\b\s*[:\-]', 'suggestion:', text, flags=re.I)
    text = re.sub(r'\bGrammar\b\s*[:\-]', 'grammar:', text, flags=re.I)
    text = re.sub(r'\bVocabulary\b\s*[:\-]', 'vocabulary:', text, flags=re.I)

    # suggestion: 앞에 빈 줄 2개 보장
    text = re.sub(r'(\S)\n{0,1}suggestion:', r'\1\n\nsuggestion:', text)

    return text

# -------------------------------------------------
# 간단한 긍/부정 신호 사전
# -------------------------------------------------
_POS_KW = ['완벽', '자연', '좋', '적절', '문제 없음', '괜찮', '정확', '올바르']
_NEG_KW = ['어색', '부자연', '수정', '개선', '문제', '애매', '불분명', '오류', '틀림']

def _polarity(text: str) -> int:
    t = text.lower()
    pos = any(k in t for k in _POS_KW)
    neg = any(k in t for k in _NEG_KW)
    if pos and not neg:
        return 1
    if neg and not pos:
        return -1
    return 0

def _candidate_lines_from_suggestion(sugg: str) -> List[str]:
    lines = []
    for ln in sugg.splitlines():
        ln = ln.strip()
        if not ln:
            continue
        # 번호 제거: "1. text" -> "text"
        ln = re.sub(r'^\d+\.\s*', '', ln)
        # 인사/군더더기 제거(가벼운 규칙)
        ln = re.sub(r'^(hi|hello|hey)[!,.]?\s*', '', ln, flags=re.I)
        lines.append(ln)
    # 너무 긴 문장보단 5~12단어 선호(간단한 우선순위)
    lines.sort(key=lambda s: abs(len(s.split()) - 9))
    return lines

def _tokenize(s: str) -> List[str]:
    return re.findall(r'\b[a-z]+\b', s.lower())

# -------------------------------------------------
# grammar / vocabulary 섹션 추출
# -------------------------------------------------
def _extract_feedback_sections(ai_output: str):
    """정규화된 텍스트에서 grammar/vocabulary만 쏙 뽑아 반환"""
    gram = re.search(
        r'(?i)grammar\s*[:\-]\s*([\s\S]*?)(?=\n\s*vocabulary\s*[:\-]|\n\s*suggestion\s*[:\-]|$)',
        ai_output
    )
    voca = re.search(
        r'(?i)vocabulary\s*[:\-]\s*([\s\S]*?)(?=\n\s*suggestion\s*[:\-]|$)',
        ai_output
    )
    g_txt = gram.group(1).strip() if gram else ''
    v_txt = voca.group(1).strip() if voca else ''
    return g_txt, v_txt

def _categories_from_sections(g_txt: str, v_txt: str) -> List[str]:
    """
    피드백 텍스트를 보고 문제가 있는 카테고리만 리턴
    - grammar가 문제면 'GRAMMAR', vocab이 문제면 'VOCABULARY'
    - 둘 다 문제 없으면 [] (빈 배열)
    """
    cats: List[str] = []

    g_pol = _polarity(g_txt)  # -1: 부정적(문제), 0: 애매, 1: 긍정(문제 없음)
    v_pol = _polarity(v_txt)

    # 명확히 부정(-1)일 때만 문제로 판단
    if g_pol == -1:
        cats.append('GRAMMAR')
    if v_pol == -1:
        cats.append('VOCABULARY')

    return cats

# -------------------------------------------------
# 점수 계산 함수
# -------------------------------------------------
def calculate_similarity_score(user_message: str, ai_output: str) -> int:
    # 방어적 정규화
    ai_output = _normalize_feedback_format(ai_output or "")

    # suggestion 블록 추출
    m = re.search(r'(?i)suggestion\s*[:\-]\s*(.+)', ai_output, re.DOTALL)
    suggestion_text = m.group(1).strip() if m else ""
    cands = _candidate_lines_from_suggestion(suggestion_text) if suggestion_text else []

    uw = set(_tokenize(user_message or ""))

    # 기본 점수 (자카드 유사도)
    best = 0.0
    if uw and cands:
        for cand in cands:
            sw = set(_tokenize(cand))
            if not sw:
                continue
            inter = len(uw & sw)
            union = len(uw | sw)
            j = inter / union if union else 0.0
            best = max(best, j)

    score = int(round(best * 100))

    # grammar / vocabulary 텍스트 기반 보정
    g_txt, v_txt = _extract_feedback_sections(ai_output)
    g_pol = _polarity(g_txt)
    v_pol = _polarity(v_txt)

    if g_pol == 1 and v_pol == 1:
        score = max(score, 90)
        if not cands or re.search(r'(no\s+change|looks\s+good|fine|perfect)', suggestion_text, re.I):
            score = max(score, 95)
    elif g_pol == -1 or v_pol == -1:
        score = min(score, 60)
    else:
        if not cands:
            score = max(score, 75 if uw else 50)

    # 최종 클램프
    score = max(15, min(100, score))
    return score

# -------------------------------------------------
# 초기 인사
# -------------------------------------------------
async def start_chat_service(data: Dict):
    topic = data.get("topic", "hospital")
    ai_role = data.get("ai_role", "doctor")
    user_role = data.get("user_role", "patient")

    prompt = create_initial_prompt(topic, ai_role, user_role)
    model = get_model()
    response = model.invoke(prompt)

    # 혹시 첫 프롬프트에도 섹션이 붙어오면 정규화
    reply = _normalize_feedback_format(getattr(response, "content", str(response)))
    return {"reply": reply}

# -------------------------------------------------
# 사용자 메시지 전송 + 점수 계산 (vocabulary 자동 추가 제거판)
# -------------------------------------------------
async def send_message_service(data: Dict):
    topic = data.get("topic")
    ai_role = data.get("ai_role")
    user_role = data.get("user_role")
    user_message = data.get("message", "")

    chain = create_roleplay_chain()
    result = chain.invoke({
        "topic": topic,
        "ai_role": ai_role,
        "user_role": user_role,
        "user_message": user_message
    })

    # 모델 응답 본문 정규화
    reply_text = getattr(result, "content", str(result))
    reply_text = _normalize_feedback_format(reply_text)

    # 점수 계산
    score = calculate_similarity_score(user_message, reply_text)

    # 카테고리 산출
    g_txt, v_txt = _extract_feedback_sections(reply_text)
    categories = _categories_from_sections(g_txt, v_txt)

    return {
        "reply": reply_text,
        "score": score,
        "categories": categories,
        # 필요하면 주석 해제해서 바로 사용
        # "grammar_feedback": g_txt,
        # "vocabulary_feedback": v_txt,
    }
