from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas import IndicatorResponse, QuoteResponse
from services.market_data import WATCHLIST_SYMBOLS, fetch_quote, ingest_watchlist_data

router = APIRouter()


@router.get("/quote/{symbol}", response_model=QuoteResponse)
def get_quote(symbol: str):
    quote = fetch_quote(symbol)
    return {
        "symbol": quote["symbol"],
        "price": quote["price"],
        "currency": "USD",
    }


@router.get("/indicators/{symbol}", response_model=IndicatorResponse)
def get_indicators(symbol: str):
    return {
        "symbol": symbol.upper(),
        "indicators": {
            "rsi": 50.0,
            "moving_average": 100.0,
        },
    }


@router.post("/ingest/run")
def run_ingest(db: Session = Depends(get_db)):
    return ingest_watchlist_data(WATCHLIST_SYMBOLS, db)
