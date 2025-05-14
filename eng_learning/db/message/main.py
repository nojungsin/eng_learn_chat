from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from .db import SessionLocal, engine, Base
from .crud import save_chat, get_all_chats
from .schemas import ChatMessageCreate, ChatMessageResponse

app = FastAPI()

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/chat/", response_model=ChatMessageResponse)
def create_chat(chat_data: ChatMessageCreate, db: Session = Depends(get_db)):
    return save_chat(db, chat_data)

@app.get("/chat/", response_model=list[ChatMessageResponse])
def read_chats(db: Session = Depends(get_db)):
    return get_all_chats(db)
