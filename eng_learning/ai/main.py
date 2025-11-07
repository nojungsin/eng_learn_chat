from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from langchain_google_genai import ChatGoogleGenerativeAI
from utils.roleplay_chain import (
    create_initial_prompt,
    create_feedback_prompt
)

load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

app = FastAPI()

#CORS 설정 (React 연결 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 배포할땐 특정 도메인만 허용하도록 변경..해 말어?
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "AI Roleplay Server running..."}

@app.post("/api/chat/start")
async def start_chat(data: dict = Body(...)):
    topic = data.get("topic", "hospital")
    ai_role = data.get("ai_role", "doctor")
    user_role = data.get("user_role", "patient")

    prompt = create_initial_prompt(topic, ai_role, user_role)
    model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
    response = model.invoke(prompt)
    return {"reply": response.content}


@app.post("/api/chat/send")
async def send_message(data: dict = Body(...)):
    topic = data.get("topic")
    ai_role = data.get("ai_role")
    user_role = data.get("user_role")
    user_message = data.get("message")

    prompt = f"""
Topic: {topic}
AI role: {ai_role}
User role: {user_role}

User said: "{user_message}"

Now:
1. Reply naturally as the {ai_role}.
2. Then provide grammar correction and feedback for the user's message.

Respond strictly in this format:
[AI Reply]: (your natural role-play response)
[Feedback]: (feedback in English, correcting grammar or word use)
"""

    model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
    response = model.invoke(prompt)
    return {"reply": response.content}

