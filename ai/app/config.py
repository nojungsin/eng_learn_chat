# app/config.py
import os
from pathlib import Path
from dotenv import load_dotenv

# ai/.env 파일을 로드하도록 경로 지정
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")