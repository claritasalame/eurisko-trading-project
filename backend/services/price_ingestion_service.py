from __future__ import annotations

from datetime import datetime, timedelta
import math
from typing import Any

import yfinance as yf
from sqlalchemy.orm import Session

try:
    from database import SessionLocal
except ModuleNotFoundError:  # pragma: no cover - supports imports from project root
    from backend.database import SessionLocal

try:
    from repositories.historical_price_repository import HistoricalPriceRepository
    from repositories.stock_repository import StockRepository
except ModuleNotFoundError:  # pragma: no cover - supports imports from project root
    from backend.repositories.historical_price_repository import HistoricalPriceRepository
    from backend.repositories.stock_repository import StockRepository


def _normalize_symbol(symbol: str) -> str:
    return symbol.strip().upper()


def _coerce_float(value: Any) -> float | None:
    if value is None:
        return None

    try:
        if hasattr(value, "item"):
            value = value.item()
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return None
        numeric_value = float(value)
        if math.isnan(numeric_value):
            return None
        return round(numeric_value, 4)
    except (TypeError, ValueError):
        return None


def _coerce_int(value: Any) -> int | None:
    if value is None:
        return None

    try:
        if hasattr(value, "item"):
            value = value.item()
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return None
        numeric_value = int(value)
        if math.isnan(float(numeric_value)):
            return None
        return numeric_value
    except (TypeError, ValueError):
        return None


def _build_company_defaults(info: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": info.get("longName") or info.get("shortName"),
        "exchange": info.get("exchange"),
        "currency": info.get("currency"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "country": info.get("country"),
        "market_cap": info.get("marketCap"),
        "website": info.get("website"),
    }


def _is_retryable_error(error: Exception) -> bool:
    message = str(error).lower()
    return any(token in message for token in ["timeout", "temporar", "network", "connection", "yahoo", "rate limit", "retry"])


def _fetch_history_with_retry(ticker: Any, symbol: str, start_date: datetime | None = None) -> Any:
    history_kwargs: dict[str, Any] = {"auto_adjust": False, "actions": False}
    if start_date is None:
        history_kwargs["period"] = "2y"
    else:
        history_kwargs["start"] = start_date

    try:
        return ticker.history(**history_kwargs)
    except Exception as exc:
        if not _is_retryable_error(exc):
            raise

        return ticker.history(**history_kwargs)


def _build_price_rows(history: Any) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for timestamp, row in history.iterrows():
        date_value = timestamp.date() if hasattr(timestamp, "date") else timestamp
        open_value = _coerce_float(row.get("Open"))
        high_value = _coerce_float(row.get("High"))
        low_value = _coerce_float(row.get("Low"))
        close_value = _coerce_float(row.get("Close"))
        adjusted_close_value = _coerce_float(row.get("Adj Close"))
        volume_value = _coerce_int(row.get("Volume"))

        rows.append(
            {
                "date": date_value,
                "open": open_value,
                "high": high_value,
                "low": low_value,
                "close": close_value,
                "adjusted_close": adjusted_close_value,
                "volume": volume_value,
            }
        )

    return rows


def ingest_stock(session: Session, symbol: str) -> dict[str, Any]:
    normalized_symbol = _normalize_symbol(symbol)
    if not normalized_symbol:
        return {"symbol": symbol, "status": "error", "error": "Empty symbol"}

    stock_repository = StockRepository(session)
    historical_price_repository = HistoricalPriceRepository(session)

    try:
        ticker = yf.Ticker(normalized_symbol)
        info: dict[str, Any] = {}
        try:
            info = ticker.info or {}
        except Exception:
            info = {}

        defaults = _build_company_defaults(info)
        stock, created = stock_repository.get_or_create(normalized_symbol, defaults)

        if not created:
            stock_repository.update_metadata(stock.id, **defaults)

        latest_price = historical_price_repository.get_latest(stock.id)
        start_date = latest_price.date if latest_price is not None else None
        history = _fetch_history_with_retry(ticker, normalized_symbol, start_date)

        if history is None or history.empty:
            session.commit()
            return {
                "symbol": normalized_symbol,
                "status": "success",
                "rows_upserted": 0,
                "created_stock": created,
            }

        rows = _build_price_rows(history)
        rows_upserted = historical_price_repository.bulk_upsert(stock.id, rows)
        session.commit()
        return {
            "symbol": normalized_symbol,
            "status": "success",
            "rows_upserted": rows_upserted,
            "created_stock": created,
        }
    except Exception as exc:
        session.rollback()
        return {"symbol": normalized_symbol, "status": "error", "error": str(exc)}


def ingest_symbols(symbols: list[str]) -> list[dict[str, Any]]:
    session = SessionLocal()
    try:
        results: list[dict[str, Any]] = []
        for symbol in symbols:
            results.append(ingest_stock(session, symbol))
        return results
    finally:
        session.close()
