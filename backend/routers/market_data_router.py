from fastapi import APIRouter

from schemas import IndicatorResponse, QuoteResponse

router = APIRouter()


@router.get("/quote/{symbol}", response_model=QuoteResponse)
def get_quote(symbol: str):
    return {
        "symbol": symbol.upper(),
        "price": 100.0,
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
