from sqlalchemy.orm import Session
from .models import LearnedWord
from .schemas import LearnedWordCreate

def save_learned_word(db: Session, data: LearnedWordCreate):
    new_entry = LearnedWord(**data.dict())
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

def get_learned_words_by_user(db: Session, user_id: int):
    return db.query(LearnedWord).filter(LearnedWord.user_id == user_id).all()
