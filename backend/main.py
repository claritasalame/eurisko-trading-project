from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from config import PORT
from database import engine
from routers import ai_router, auth_router, chat_router, market_data_router, news_router, stocks_router
from services.market_data import run_watchlist_ingestion
from services.qdrant_client import ensure_news_collection

scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("Postgres connection verified")
    except Exception as exc:
        print(f"Postgres connection check failed: {exc}")
        raise

    try:
        ensure_news_collection()
        scheduler.add_job(
            func=run_watchlist_ingestion,
            trigger="interval",
            minutes=15,
            id="market_data_ingest",
            replace_existing=True,
        )
        scheduler.start()
        print("Market ingestion scheduler started")
    except Exception as exc:
        print(f"Scheduler startup failed: {exc}")

    yield

    if scheduler.running:
        scheduler.shutdown()


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
app.include_router(stocks_router.router, prefix="/api/stocks", tags=["stocks"])


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
