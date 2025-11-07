from langchain.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

def create_roleplay_chain(topic: str, ai_role: str, user_role: str):
    prompt = ChatPromptTemplate.from_template("""
You are participating in an English role-play conversation.

- Topic: {topic}
- Your role: {ai_role}
- User's role: {user_role}
- Objective: Practice natural English conversation.

When replying to the user:
1. Continue the conversation naturally based on your role.
2. After responding, provide feedback:
   - Grammar correction (if needed)
   - Better word choices
   - Clarity or sentence improvement

Respond in this format:
[AI Reply]: ...
[Feedback]: ...
""")
    model = ChatGoogleGenerativeAI(model="gemini-1.5-pro")
    return prompt | model


def create_initial_prompt(topic: str, ai_role: str, user_role: str):
    return f"""
You are {ai_role}, and the user is {user_role}.
Start a natural conversation about {topic}.
Say a short greeting first.
"""


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
