from fastapi import FastAPI
from accounts.auth import router as auth_router
from accounts.database import engine, Base

Base.metadata.create_all(bind=engine)  # DB 테이블 생성

app = FastAPI()

app.include_router(auth_router, prefix="/auth")
