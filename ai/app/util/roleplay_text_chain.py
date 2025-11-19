from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
def create_initial_prompt(topic: str, ai_role: str, user_role: str):
    # 초기 인사는 영어 1~2문장만, 메타 질문 금지, [Feedback] 금지
    return f"""
You are {ai_role}. The user is {user_role}. Topic: "{topic}".

Begin the role-play immediately in ENGLISH.

STRICT REQUIREMENTS:
- Do NOT ask whether to start, or what your role/topic is.
- Do NOT mention instructions, prompts, roles, or the word "start".
- Do NOT include any [Feedback] section on this first turn.
- Output ONLY this single line:

[AI Reply]: <1–2 natural sentences to open the conversation in your role, ending with a topical question>
""".strip()

def create_roleplay_chain():
    """
    출력 형식을 강제:
    [AI Reply]: (영어)
    [Feedback]:
    grammar: ... (영어, 문제 없으면 영어로 'Grammar쪽은 완벽합니다!')
    vocabulary: ... (영어, 문제 없으면 영어로 'Vocabulary쪽은 완벽합니다')

    (빈 줄 2개)
    suggestion:
    - 문장이 1가지로 명확하면 수정된 문장 1개만.
    - 해석이 여러 갈래로 가능한 경우 '1. ...', '2. ...' 처럼 번호 목록.
    """
    prompt = ChatPromptTemplate.from_template("""
You are participating in an English role-play conversation.

- Topic: {topic}
- Your role: {ai_role}
- User's role: {user_role}
- Objective: Practice natural English conversation.

CRITICAL BEHAVIOR RULES:
- Do NOT ask meta-questions like "Should we start?", "What is my role?", or "What is the topic?".
- Assume the given topic and roles are final and already agreed.
- Stay strictly in character and proceed with the conversation.

- If the user inputs Korean:
  * Do NOT switch to Korean.
  * Do NOT ask meta-questions or explanations.
  * Output the reply as:
      [AI Reply]: Please continue in English so we can practice together.
  * Then still produce [Feedback] (in Korean) and suggestion sections normally.

User just said: "{user_message}"

STRICT OUTPUT REQUIREMENTS (very important):

1) Reply section (in ENGLISH):
   Start with exactly:
   [AI Reply]: <your natural, concise reply in English following your role>

2) Feedback section (in KOREAN):
   After the reply, add a newline and then:
   [Feedback]:
   grammar: <문법 피드백 1~3문장. 오류가 없으면 'Grammar쪽은 완벽합니다!' 라고 영어로 적기>
   vocabulary: <어휘/표현 피드백 1~3문장. 오류가 없으면 'Vocabulary쪽은 완벽합니다' 라고 영어로 적기>

   - 'grammar:'와 'vocabulary:'는 소문자 키로 시작합니다.
   - 각 줄은 단문 위주로 간결하게 작성합니다.
   - 사용자가 쓴 원문에서 잘못된 단어나 어색한 표현이 있으면 무엇이 왜 문제인지 간단히 설명하고 대체 표현을 1~2개 제시합니다.

3) Suggestion section (in ENGLISH, lower-case header):
   Add TWO blank lines after the vocabulary line, then write exactly:
   suggestion:
   - If there is a single clear corrected sentence, output that one corrected sentence only.
   - If multiple interpretations/corrections are plausible, output a numbered list like:
     1. <first corrected sentence>
     2. <second corrected sentence>
     (and so on, only as many as are reasonable)

Style rules:
- The [AI Reply] must be in English only.
- The [Feedback] must be in Korean only.
- Keep all outputs concise and relevant to the user's last message.
- Do NOT include any extra sections, headings, or explanations beyond the exact format above.
- Preserve the exact casing of keys: [AI Reply], [Feedback], 'grammar:', 'vocabulary:', and 'suggestion:'.
- Ensure exactly two blank lines before 'suggestion:'.

Now produce the output in the exact format.
""")

    model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
    return prompt | model
