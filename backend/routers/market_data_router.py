from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from schemas import IndexQuoteResponse, IndicatorResponse, MarketHistoryPoint, QuoteResponse
from services.market_data import HISTORY_RANGES, WATCHLIST_SYMBOLS, fetch_history, fetch_indices, fetch_quote, ingest_watchlist_data

router = APIRouter()


@router.get("/indices", response_model=list[IndexQuoteResponse])
def get_indices():
    return fetch_indices()


@router.get("/quote/{symbol}", response_model=QuoteResponse)
def get_quote(symbol: str):
    quote = fetch_quote(symbol)
    return {
        **quote,
        "currency": "USD",
    }


@router.get("/history/{symbol}", response_model=list[MarketHistoryPoint])
def get_history(symbol: str, range_name: str = Query("1d", alias="range")):
    normalized_range = range_name.lower()
    if normalized_range not in HISTORY_RANGES:
        raise HTTPException(status_code=422, detail="Range must be one of: 1d, 1w, 1m, 1y")
    try:
        return fetch_history(symbol.upper(), normalized_range)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


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
