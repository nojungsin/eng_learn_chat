from fastapi import APIRouter, Body
from ..services.textchat_service import start_chat_service, send_message_service

router = APIRouter()

@router.post("/start")
async def start_chat(data: dict = Body(...)):
    """대화 시작: 주제, 역할 기반 인사"""
    return await start_chat_service(data)

@router.post("/send")
async def send_message(data: dict = Body(...)):
    """사용자 메시지 전송 및 AI 응답"""
    return await send_message_service(data)
