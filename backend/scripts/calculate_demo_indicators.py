from __future__ import annotations

import sys
from pathlib import Path

try:
    from services.technical_indicator_service import calculate_indicators_for_symbols
except ModuleNotFoundError:
    backend_root = Path(__file__).resolve().parent.parent
    if str(backend_root) not in sys.path:
        sys.path.insert(0, str(backend_root))
    from backend.services.technical_indicator_service import calculate_indicators_for_symbols

DEMO_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "TSLA", "NVDA", "AMZN", "META", "BTC-USD", "GC=F", "EURUSD=X", "^GSPC"]


if __name__ == "__main__":
    results = calculate_indicators_for_symbols(DEMO_SYMBOLS)
    for result in results:
        if result.get("status") == "success":
            print(f"{result['symbol']}: success | rows upserted: {result.get('rows_upserted', 0)}")
        else:
            print(f"{result['symbol']}: error | {result.get('error', 'unknown error')}")
