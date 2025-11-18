from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .routers.text import router as textr
from .routers.voice import router as voicer

app = FastAPI()

# CORS 설정 (배포 시 실제 도메인으로 제한 권장)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static/recordings", StaticFiles(directory="app/storage/recordings"), name="recordings")
app.mount("/static/tts", StaticFiles(directory="app/storage/tts"), name="tts")

# 라우터 등록
app.include_router(textr, prefix="/api/text",tags=["text"])
app.include_router(voicer, prefix="/api/voice", tags=["voice"])
#app.include_router(testgen, prefix="/test", tags=["test"])

@app.get("/")
def home():
    return {"message": "AI Roleplay Server running..."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)