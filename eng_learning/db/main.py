from db.message.db import Base, engine
from .models import LearnedWord

Base.metadata.create_all(bind=engine)


from fastapi import APIRouter, Depends
from .schemas import VocabItem, GrammarItem, LearnedWordCreate
from .sample_data import vocabulary_data, grammar_data
from .models import LearnedWord
from . import crud
from db.message.db import SessionLocal
from sqlalchemy.orm import Session
from typing import List
import random

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 1. 어휘 목록
@router.get("/study/vocabulary", response_model=List[VocabItem])
def get_vocabulary():
    return vocabulary_data

# 2. 문법 목록
@router.get("/study/grammar", response_model=List[GrammarItem])
def get_grammar():
    return grammar_data

# 3. 단어 학습 기록 저장
@router.post("/study/learned")
def learn_word(data: LearnedWordCreate, db: Session = Depends(get_db)):
    return crud.save_learned_word(db, data)

# 4. 사용자별 학습 기록 조회
@router.get("/study/learned/{user_id}")
def get_learned(user_id: int, db: Session = Depends(get_db)):
    return crud.get_learned_words_by_user(db, user_id)

# 5. 단어 뜻 맞추기 퀴즈
@router.get("/study/quiz")
def get_quiz():
    correct = random.choice(vocabulary_data)
    wrong_choices = random.sample(
        [v for v in vocabulary_data if v["word"] != correct["word"]],
        k=3
    )
    choices = [correct["meaning"]] + [w["meaning"] for w in wrong_choices]
    random.shuffle(choices)

    return {
        "question": f"'{correct['word']}'의 뜻은 무엇인가요?",
        "choices": choices,
        "answer": correct["meaning"]  # 정답은 실제 서비스 시 제외해도 됨
    }
