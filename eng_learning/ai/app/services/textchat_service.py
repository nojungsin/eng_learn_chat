from ..services.llm_client import get_model
from app.util.roleplay_chain import create_initial_prompt, create_roleplay_chain
import re
from typing import Dict
from typing import Dict, List

# 응답 포맷 정규화
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
    # (이미 두 줄 이상이면 그대로 두고, 0~1줄이면 2줄로 맞춤)
    text = re.sub(r'(\S)\n{0,1}suggestion:', r'\1\n\nsuggestion:', text)

    return text

#---------------------------------------------------
#vocabulary 추가
STOPWORDS = {
    'is','are','am','the','a','an','to','of','in','on','at','and','or','but','be','been','being',
    'was','were','do','does','did','have','has','had','i','you','he','she','it','we','they',
    'me','him','her','them','my','your','his','its','our','their','this','that','these','those',
    'for','with','as','by','from','about','into','over','after','before','between','up','down',
}

def _is_proper_noun(token: str, idx_in_sent: int) -> bool:
    # 문장 첫 단어는 대문자라도 고유명사로 보지 않음
    if idx_in_sent == 0:
        return False
    return bool(re.match(r'^[A-Z][a-z]+$', token))

def _lemmatize_en(word: str) -> str:
    w = word.lower()
    # 아주 간단한 규칙 기반 원형화 (정밀도보다 보수적)
    if re.match(r'.+ies$', w):
        return re.sub(r'ies$', 'y', w)
    if re.match(r'.+ves$', w):
        return re.sub(r'ves$', 'f', w)  # leaves->leaf 등 (불완전함)
    if re.match(r'.+([sxz]|[cs]h)es$', w):
        return re.sub(r'es$', '', w)     # boxes->box, watches->watch
    if re.match(r'.+s$', w) and not re.match(r'.+ss$', w):
        w = re.sub(r's$', '', w)         # cats->cat
    if re.match(r'.+ied$', w):
        return re.sub(r'ied$', 'y', w)   # studied->study
    if re.match(r'.+ed$', w):
        w = re.sub(r'ed$', '', w)        # worked->work
    if re.match(r'.+ing$', w):
        base = re.sub(r'ing$', '', w)    # running->run (runni->runn 방지 미세함)
        if base.endswith(base[-1:] + base[-1:]):  # running->run (nn 제거)
            base = base[:-1]
        return base
    return w

def _extract_vocab_entries(v_txt: str, suggestion: str, user_msg: str) -> List[Dict]:
    """
    vocabulary 섹션 텍스트(v_txt)와 suggestion 문장을 참고하여
    [{word, meaningKo, example}] 목록을 만든다.
    """
    entries: List[Dict] = []

    # 1) vocabulary 텍스트에서 "단어(한국어)" 패턴 탐색: e.g., "abandon (버리다)", "efficient - 효율적인"
    #    단어는 알파벳/하이픈 혼용 허용
    for m in re.finditer(r'(?i)\b([A-Za-z\-]+)\b\s*(?:[\(\-:]\s*([가-힣 ,/]+)\)?)?', v_txt):
        raw = m.group(1)
        meaning_ko = (m.group(2) or '').strip()
        if not raw:
            continue

        # 기능어/고유명사 필터
        # 문장 내 위치를 모르니, 대문자 시작 단어는 일단 제외(너무 보수적이면 아래 조건 완화)
        if raw.lower() in STOPWORDS:
            continue
        if re.match(r'^[A-Z][a-z]+$', raw):
            continue

        lemma = _lemmatize_en(raw)
        if not lemma or lemma in STOPWORDS:
            continue

        # substitution 문장에 단어가 포함되면 그 문장을 example로 사용
        example = None
        if suggestion and re.search(rf'(?i)\b{re.escape(lemma)}\b', suggestion):
            example = suggestion.strip()

        # 중복 방지
        if any(e['word'] == lemma for e in entries):
            # 기존 항목에 예문이 없고 지금 예문이 있으면 넣어줌
            for e in entries:
                if e['word'] == lemma and not e.get('example') and example:
                    e['example'] = example
            continue

        entries.append({
            'word': lemma,
            'meaningKo': meaning_ko or None,
            'example': example
        })

    # 2) vocabulary 텍스트에 명시가 없을 때, 사용자 문장 vs suggestion 차이 기반(보수적으로)
    if not entries and suggestion:
        user_tokens = re.findall(r"[A-Za-z\-']+", user_msg)
        sugg_tokens = re.findall(r"[A-Za-z\-']+", suggestion)
        u_set = { _lemmatize_en(t) for t in user_tokens if t and t.lower() not in STOPWORDS }
        s_set = { _lemmatize_en(t) for t in sugg_tokens if t and t.lower() not in STOPWORDS }

        # 제안문장에 있고 사용자 문장에 없는 단어(교체/추가된 핵심어 추정)
        for lem in sorted((s_set - u_set)):
            if re.match(r'^[A-Z][a-z]+$', lem):  # 대문자 시작(고유명사 추정) 배제
                continue
            entries.append({
                'word': lem,
                'meaningKo': None,           # 의미는 모델 프롬프트 개선으로 채우는 걸 권장
                'example': suggestion.strip()
            })

    return entries

# send_message_service 내부에서 voca까지 채워서 반환
async def send_message_service(data: Dict):
    # ... (생략: topic/role/chain 호출)
    reply_text = getattr(result, "content", str(result))
    reply_text = _normalize_feedback_format(reply_text)

    score = calculate_similarity_score(user_message, reply_text)

    g_txt, v_txt = _extract_feedback_sections(reply_text)
    categories = _categories_from_sections(g_txt, v_txt)

    # feedback 파싱해서 suggestion 문장 얻는 부분이 이미 있다면 재사용:
    explain, suggestion, grammarText, vocabText = parseFeedbackParts(reply_text)
    voca_entries = []
    if 'VOCABULARY' in categories:
        voca_entries = _extract_vocab_entries(vocabText or v_txt, suggestion or '', user_message)

    return {
        "reply": reply_text,
        "score": score,
        "categories": categories,
        "voca": voca_entries,  # [{word, meaningKo, example}]
    }
#------------------

# 간단한 긍/부정 신호 사전
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

def _candidate_lines_from_suggestion(sugg: str):
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

def _tokenize(s: str):
    return re.findall(r'\b[a-z]+\b', s.lower())

# -------------------------------------------------
# 점수 계산 함수 (강화본)
# -------------------------------------------------
def calculate_similarity_score(user_message: str, ai_output: str) -> int:
    # 방어적으로 한 번 더 정규화 (혹시 상위에서 빼먹어도 안전)
    ai_output = _normalize_feedback_format(ai_output or "")

    # suggestion 블록 추출 (콜론/대시/개행 변형 허용)
    m = re.search(r'(?i)suggestion\s*[:\-]\s*(.+)', ai_output, re.DOTALL)
    suggestion_text = m.group(1).strip() if m else ""
    cands = _candidate_lines_from_suggestion(suggestion_text) if suggestion_text else []

    uw = set(_tokenize(user_message or ""))

    # 기본 점수
    best = 0.0
    if uw and cands:
        for cand in cands:
            sw = set(_tokenize(cand))
            if not sw:
                continue
            inter = len(uw & sw)
            union = len(uw | sw)
            j = inter / union if union else 0.0
            if j > best:
                best = j

    score = int(round(best * 100))

    # grammar / vocabulary 구간 추출 (콜론/대시 변형 허용)
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

    g_pol = _polarity(g_txt)
    v_pol = _polarity(v_txt)

    # 긍/부정 일관성 보정
    if g_pol == 1 and v_pol == 1:
        # 둘 다 긍정이면 하한 90
        score = max(score, 90)
        # suggestion 자체가 없거나 "변경 불필요" 톤이면 95로 고정
        if not cands or re.search(r'(no\s+change|looks\s+good|fine|perfect)', suggestion_text, re.I):
            score = max(score, 95)
    elif g_pol == -1 or v_pol == -1:
        # 하나라도 부정이면 상한 60
        score = min(score, 60)
    else:
        # g/v 신호가 애매하고 suggestion도 없으면 중간값
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
# ... (기존 _normalize_feedback_format, _polarity 등은 그대로 사용)

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
    """피드백 텍스트를 보고 문제가 있는 카테고리만 리턴
       - grammar가 문제면 'GRAMMAR', vocab이 문제면 'VOCABULARY'
       - 둘 다 문제 없으면 [] (빈 배열)
    """
    cats: List[str] = []

    g_pol = _polarity(g_txt)  # -1: 부정적(문제), 0: 애매, 1: 긍정(문제 없음)
    v_pol = _polarity(v_txt)

    # 규칙:
    #  - 명확히 부정(-1)일 때만 문제로 판단하여 카테고리에 포함
    #  - 나머지(0,1)는 문제 없음으로 취급 (프롬프트가 '완벽합니다'를 주도록 강제돼 있으므로 OK)
    if g_pol == -1:
        cats.append('GRAMMAR')
    if v_pol == -1:
        cats.append('VOCABULARY')

    return cats

# -------------------------------------------------
# 사용자 메시지 전송 + 점수 계산
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

    # 모델 응답 본문
    reply_text = getattr(result, "content", str(result))
    # ★ 정규화 필수
    reply_text = _normalize_feedback_format(reply_text)

    # 점수 계산
    score = calculate_similarity_score(user_message, reply_text)

    # 카테고리 산출
    g_txt, v_txt = _extract_feedback_sections(reply_text)
    categories = _categories_from_sections(g_txt, v_txt)

    return {
        "reply": reply_text,
        "score": score,
        "categories": categories,               # <= 추가
        # 필요하다면 아래 2개도 함께 보내두면 프론트에서 파싱 없이 바로 사용 가능
        # "grammar_feedback": g_txt,
        # "vocabulary_feedback": v_txt,
    }
