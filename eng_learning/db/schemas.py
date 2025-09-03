from pydantic import BaseModel

class VocabItem(BaseModel):
    word: str
    meaning: str

class GrammarItem(BaseModel):
    title: str
    explanation: str
    example: str

class LearnedWordCreate(BaseModel):
    user_id: int
    word: str