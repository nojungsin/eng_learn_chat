from langchain_google_genai import ChatGoogleGenerativeAI
import os
from dotenv import load_dotenv

load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

def get_model(model_name="gemini-2.0-flash"):
    """Gemini 모델 인스턴스 반환"""
    return ChatGoogleGenerativeAI(model=model_name)