from __future__ import annotations

import math
import sys
from datetime import date
from pathlib import Path
from typing import Any

import pandas as pd
from ta.momentum import RSIIndicator
from ta.trend import ADXIndicator, EMAIndicator, MACD, SMAIndicator
from ta.volatility import AverageTrueRange, BollingerBands
from ta.volume import OnBalanceVolumeIndicator

try:
    from database import SessionLocal
except ModuleNotFoundError:  # pragma: no cover - supports imports from project root
    from backend.database import SessionLocal

try:
    from repositories.historical_price_repository import HistoricalPriceRepository
    from repositories.stock_repository import StockRepository
    from repositories.technical_indicator_repository import TechnicalIndicatorRepository
except ModuleNotFoundError:  # pragma: no cover - supports imports from project root
    from backend.repositories.historical_price_repository import HistoricalPriceRepository
    from backend.repositories.stock_repository import StockRepository
    from backend.repositories.technical_indicator_repository import TechnicalIndicatorRepository


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
        return round(numeric_value, 6)
    except (TypeError, ValueError):
        return None


def _build_indicator_rows(prices_df: pd.DataFrame) -> list[dict[str, Any]]:
    if prices_df.empty:
        return []

    frame = prices_df.copy()
    for column in ["open", "high", "low", "close", "volume"]:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")

    frame = frame.sort_values("date").reset_index(drop=True)

    close_series = frame["close"]
    high_series = frame["high"]
    low_series = frame["low"]
    volume_series = frame["volume"]

    rsi_values = pd.Series(RSIIndicator(close=close_series, window=14).rsi(), dtype=float)
    sma_20_values = pd.Series(SMAIndicator(close=close_series, window=20).sma_indicator(), dtype=float)
    sma_50_values = pd.Series(SMAIndicator(close=close_series, window=50).sma_indicator(), dtype=float)
    ema_20_values = pd.Series(EMAIndicator(close=close_series, window=20).ema_indicator(), dtype=float)
    ema_50_values = pd.Series(EMAIndicator(close=close_series, window=50).ema_indicator(), dtype=float)

    macd_indicator = MACD(close=close_series, window_slow=26, window_fast=12, window_sign=9)
    macd_values = pd.Series(macd_indicator.macd(), dtype=float)
    macd_signal_values = pd.Series(macd_indicator.macd_signal(), dtype=float)
    macd_histogram_values = pd.Series(macd_indicator.macd_diff(), dtype=float)

    bollinger_indicator = BollingerBands(close=close_series, window=20, window_dev=2)
    bollinger_upper_values = pd.Series(bollinger_indicator.bollinger_hband(), dtype=float)
    bollinger_middle_values = pd.Series(bollinger_indicator.bollinger_mavg(), dtype=float)
    bollinger_lower_values = pd.Series(bollinger_indicator.bollinger_lband(), dtype=float)

    atr_values = pd.Series(
        AverageTrueRange(high=high_series, low=low_series, close=close_series, window=14).average_true_range(),
        dtype=float,
    )
    adx_values = pd.Series(ADXIndicator(high=high_series, low=low_series, close=close_series, window=14).adx(), dtype=float)
    obv_values = pd.Series(OnBalanceVolumeIndicator(close=close_series, volume=volume_series).on_balance_volume(), dtype=float)

    rows: list[dict[str, Any]] = []
    for index, row in frame.iterrows():
        rows.append(
            {
                "date": row["date"],
                "rsi": _coerce_float(rsi_values.iloc[index]),
                "sma_20": _coerce_float(sma_20_values.iloc[index]),
                "sma_50": _coerce_float(sma_50_values.iloc[index]),
                "ema_20": _coerce_float(ema_20_values.iloc[index]),
                "ema_50": _coerce_float(ema_50_values.iloc[index]),
                "macd": _coerce_float(macd_values.iloc[index]),
                "macd_signal": _coerce_float(macd_signal_values.iloc[index]),
                "macd_histogram": _coerce_float(macd_histogram_values.iloc[index]),
                "bollinger_upper": _coerce_float(bollinger_upper_values.iloc[index]),
                "bollinger_middle": _coerce_float(bollinger_middle_values.iloc[index]),
                "bollinger_lower": _coerce_float(bollinger_lower_values.iloc[index]),
                "atr": _coerce_float(atr_values.iloc[index]),
                "adx": _coerce_float(adx_values.iloc[index]),
                "obv": _coerce_float(obv_values.iloc[index]),
            }
        )

    return rows


def calculate_indicators_for_stock(session, symbol: str) -> dict[str, Any]:
    normalized_symbol = _normalize_symbol(symbol)
    if not normalized_symbol:
        return {"symbol": symbol, "status": "error", "error": "Empty symbol"}

    stock_repository = StockRepository(session)
    historical_price_repository = HistoricalPriceRepository(session)
    technical_indicator_repository = TechnicalIndicatorRepository(session)

    try:
        stock = stock_repository.get_by_symbol(normalized_symbol)
        if stock is None:
            return {"symbol": normalized_symbol, "status": "error", "error": "Stock not found"}

        start_date = date(1970, 1, 1)
        end_date = date.today()
        historical_prices = historical_price_repository.get_price_range(stock.id, start_date, end_date)

        if len(historical_prices) < 2:
            return {"symbol": normalized_symbol, "status": "error", "error": "Not enough historical price data"}

        prices_df = pd.DataFrame(
            {
                "date": [price.date for price in historical_prices],
                "open": [float(price.open) if price.open is not None else None for price in historical_prices],
                "high": [float(price.high) if price.high is not None else None for price in historical_prices],
                "low": [float(price.low) if price.low is not None else None for price in historical_prices],
                "close": [float(price.close) if price.close is not None else None for price in historical_prices],
                "volume": [float(price.volume) if price.volume is not None else None for price in historical_prices],
            }
        )

        rows = _build_indicator_rows(prices_df)
        rows_upserted = technical_indicator_repository.bulk_upsert(stock.id, rows)
        session.commit()
        return {"symbol": normalized_symbol, "status": "success", "rows_upserted": rows_upserted}
    except Exception as exc:
        session.rollback()
        return {"symbol": normalized_symbol, "status": "error", "error": str(exc)}


def calculate_indicators_for_symbols(symbols: list[str]) -> list[dict[str, Any]]:
    session = SessionLocal()
    try:
        results: list[dict[str, Any]] = []
        for symbol in symbols:
            try:
                results.append(calculate_indicators_for_stock(session, symbol))
            except Exception as exc:
                results.append({"symbol": _normalize_symbol(symbol), "status": "error", "error": str(exc)})
        return results
    finally:
        session.close()
