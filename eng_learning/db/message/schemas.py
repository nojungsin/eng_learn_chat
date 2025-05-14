from pydantic import BaseModel
from datetime import datetime

class ChatMessageBase(BaseModel):
    user_id: int
    message: str

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageResponse(ChatMessageBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True
