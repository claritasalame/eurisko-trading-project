def get_market_snapshot(symbol: str) -> dict:
    return {
        "symbol": symbol.upper(),
        "price": 100.0,
        "status": "placeholder",
    }
