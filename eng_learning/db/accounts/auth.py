from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from accounts.models import User
from accounts.database import get_db
from accounts.schemas import UserCreate
import bcrypt, secrets

router = APIRouter()

@router.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # 이메일 중복 확인
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="이미 존재하는 사용자 이름입니다.")

    # 비밀번호 해싱 후 저장
    hashed_password = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt())
    new_user = User(email=user.email, hashed_password=hashed_password.decode("utf-8"))

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "회원가입이 완료되었습니다!"}

import jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Security
from accounts.schemas import Token

SECRET_KEY = secrets.token_hex(32)
ALGORITHM = "HS256"

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not bcrypt.checkpw(form_data.password.encode("utf-8"), user.hashed_password.encode("utf-8")):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    access_token = jwt.encode({"sub": user.email, "exp": datetime.utcnow() + timedelta(hours=24)}, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"access_token": access_token, "token_type": "bearer"}
