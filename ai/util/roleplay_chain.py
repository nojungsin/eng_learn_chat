from langchain.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

# 체인: 사용자 발화까지 템플릿에 포함 (이전 버전은 user_message를 안 받았음)
def create_roleplay_chain():
    prompt = ChatPromptTemplate.from_template("""
You are participating in an English role-play conversation.

- Topic: {topic}
- Your role: {ai_role}
- User's role: {user_role}
- Objective: Practice natural English conversation.

User just said: "{user_message}"

When replying to the user:
1. Continue the conversation naturally based on your role.
2. After responding, provide feedback:
   - Grammar correction (if needed)
   - Better word choices
   - Clarity or sentence improvement

Respond strictly in this format:
[AI Reply]: ...
[Feedback]: ...
""")
    # 현재 프로젝트가 잘 도는 모델명을 유지
    model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
    return prompt | model

def create_initial_prompt(topic: str, ai_role: str, user_role: str):
    return f"""
You are {ai_role}, and the user is {user_role}.
Start a natural conversation about {topic}.
Say a short greeting first.
"""

# (옵션) 필요 시 계속 사용할 수 있도록 남겨둠 — 지금은 사용 안 함
def create_feedback_prompt(topic: str, ai_role: str, user_role: str, user_message: str):
    return f"""
Topic: {topic}
AI role: {ai_role}
User role: {user_role}

User said: "{user_message}"

Now:
1. Reply naturally in context.
2. Provide grammar correction and feedback.
Respond in this format:
[AI Reply]: ...
[Feedback]: ...
"""
