from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import text, voice, testgen

app = FastAPI()

# CORS 설정 (배포 시 실제 도메인으로 제한 권장)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(text.router, prefix="/api/text",tags=["text"])
#app.include_router(voice.router, prefix="/voice", tags=["voice"])
#app.include_router(testgen.router, prefix="/test", tags=["test"])

@app.get("/")
def home():
    return {"message": "AI Roleplay Server running..."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)