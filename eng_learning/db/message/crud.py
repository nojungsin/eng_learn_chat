from sqlalchemy.orm import Session
from .models import ChatMessage
from .schemas import ChatMessageCreate

# 채팅 메시지 저장
def save_chat(db: Session, chat_data: ChatMessageCreate):
    new_message = ChatMessage(**chat_data.dict())
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message

# 모든 채팅 메시지 가져오기
def get_all_chats(db: Session):
    return db.query(ChatMessage).all()
