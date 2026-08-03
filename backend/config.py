import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dev:devpassword@postgres:5432/trading_platform")
QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
PORT = int(os.getenv("PORT", "4000"))
