# app/routers/voice_router.py
import os, uuid, wave
from fastapi import APIRouter, UploadFile, File, Form
from ..services.stt_google import transcribe_bytes
from ..services.tts_google import synth_to_file
from ..services.voicechat_service import run_chat_pipeline

RECORD_DIR = "app/storage/recordings"
TTS_DIR = "app/storage/tts"

router = APIRouter()

@router.post("/stt")
async def stt_recognize(file: UploadFile = File(...), sample_rate: int = Form(16000)):
    """
    UI에서 업로드된 음성(Blob)을 받아 Google STT로 텍스트 변환
    """
    audio_bytes = await file.read()
    text = transcribe_bytes(audio_bytes, sample_rate_hz=sample_rate)
    return {"text": text}

@router.post("/reply")
async def get_ai_reply(user_text: str = Form(...)):
    """
    STT 결과 텍스트를 받아, 공용 채팅 파이프라인 실행 → ai_reply, feedback 반환
    """
    result = run_chat_pipeline(user_text)
    return result

@router.post("/tts")
async def tts_synthesize(ai_reply: str = Form(...)):
    """
    AI 텍스트를 TTS로 합성 → mp3 파일 경로 반환
    """
    tts_id = str(uuid.uuid4())
    out_path = os.path.join(TTS_DIR, f"{tts_id}.mp3")
    synth_to_file(ai_reply, out_path, audio_format="MP3")
    return {"tts_path": f"/static/tts/{tts_id}.mp3"}

@router.post("/end")
async def end_session_and_save_raw(file: UploadFile = File(...), sample_rate: int = Form(16000)):
    """
    '종료' 시 마지막/전체 사용자 원본 음성을 .wav로 저장. DB 저장 없음.
    """
    raw = await file.read()
    os.makedirs(RECORD_DIR, exist_ok=True)
    wav_id = str(uuid.uuid4())
    wav_path = os.path.join(RECORD_DIR, f"{wav_id}.wav")

    # 단순 저장: 이미 wav라면 그대로 쓰고, 아니라면(예: webm/opus) 백엔드에서 ffmpeg로 변환 고려.
    with open(wav_path, "wb") as f:
        f.write(raw)
    return {"saved_wav": f"/static/recordings/{wav_id}.wav"}
