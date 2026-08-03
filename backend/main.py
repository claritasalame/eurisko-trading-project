from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from config import PORT
from database import engine
from routers import ai_router, auth_router, chat_router, market_data_router, news_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("Postgres connection verified")
    except Exception as exc:
        print(f"Postgres connection check failed: {exc}")
        raise
    yield


app = FastAPI(title="eurisko-trading-project", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat_router.router, prefix="/api/chat", tags=["chat"])
app.include_router(news_router.router, prefix="/api/news", tags=["news"])
app.include_router(market_data_router.router, prefix="/api/market-data", tags=["market-data"])
app.include_router(ai_router.router, prefix="/api/ai", tags=["ai"])


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
