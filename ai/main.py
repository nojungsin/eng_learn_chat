from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from langchain_google_genai import ChatGoogleGenerativeAI
from util.roleplay_chain import (
    create_initial_prompt,
    create_roleplay_chain,   # ← 체인 실제 사용
)

load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

app = FastAPI()

# CORS (배포 시 도메인 제한 권장)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "AI Roleplay Server running..."}

# 대화 시작: 인사/오프닝 한 번만 생성
@app.post("/api/chat/start")
async def start_chat(data: dict = Body(...)):
    topic = data.get("topic", "hospital")
    ai_role = data.get("ai_role", "doctor")
    user_role = data.get("user_role", "patient")

    prompt = create_initial_prompt(topic, ai_role, user_role)
    model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
    response = model.invoke(prompt)
    return {"reply": response.content}

# 메시지 전송: 체인으로 일관된 형식([AI Reply]/[Feedback]) 보장
@app.post("/api/chat/send")
async def send_message(data: dict = Body(...)):
    topic = data.get("topic")
    ai_role = data.get("ai_role")
    user_role = data.get("user_role")
    user_message = data.get("message", "")

    # 프롬프트+모델 파이프라인(체인)
    chain = create_roleplay_chain()
    result = chain.invoke({
        "topic": topic,
        "ai_role": ai_role,
        "user_role": user_role,
        "user_message": user_message
    })
    # LangChain 모델 응답은 대부분 .content에 텍스트가 들어있음
    content = getattr(result, "content", str(result))
    return {"reply": content}
