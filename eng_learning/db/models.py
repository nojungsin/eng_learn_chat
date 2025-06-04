from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from db.message.db import Base
class LearnedWord(Base):
    __tablename__ = "learned_words"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    word = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
