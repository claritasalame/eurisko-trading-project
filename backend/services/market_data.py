from datetime import datetime, timezone
from typing import Any
import math

import yfinance as yf
from sqlalchemy.orm import Session

from database import SessionLocal
from models import MarketData, NewsArticle
from services.embeddings import chunk_article, embed_text
from services.qdrant_client import upsert_news_embedding

WATCHLIST_SYMBOLS = ["AAPL", "MSFT", "NVDA", "TSLA", "GOOGL", "AMZN", "META", "BTC-USD", "GC=F", "EURUSD=X", "^GSPC"]
MARKET_INDICES = {
    "^GSPC": "S&P 500",
    "^IXIC": "Nasdaq Composite",
    "^DJI": "Dow Jones",
    "^VIX": "Volatility Index",
}

HISTORY_RANGES = {
    "1d": ("1d", "5m"),
    "1w": ("5d", "30m"),
    "1m": ("1mo", "1d"),
    "1y": ("1y", "1wk"),
}


def _optional_number(value) -> float | None:
    number = float(value)
    return None if math.isnan(number) else round(number, 4)


def fetch_history(symbol: str, range_name: str) -> list[dict]:
    period, interval = HISTORY_RANGES[range_name]
    history = yf.Ticker(symbol).history(period=period, interval=interval, auto_adjust=False, actions=False)
    if history.empty:
        raise ValueError(f"No historical data returned for {symbol}")

    close = history["Close"].astype(float)
    sma = close.rolling(window=20, min_periods=20).mean()
    delta = close.diff()
    gains = delta.clip(lower=0).rolling(window=14, min_periods=14).mean()
    losses = (-delta.clip(upper=0)).rolling(window=14, min_periods=14).mean()
    relative_strength = gains / losses.replace(0, float("nan"))
    rsi = 100 - (100 / (1 + relative_strength))
    ema_12 = close.ewm(span=12, adjust=False).mean()
    ema_26 = close.ewm(span=26, adjust=False).mean()
    macd = ema_12 - ema_26
    macd_signal = macd.ewm(span=9, adjust=False).mean()

    return [
        {
            "timestamp": timestamp.to_pydatetime(),
            "price": round(float(close.iloc[index]), 4),
            "sma": _optional_number(sma.iloc[index]),
            "rsi": _optional_number(rsi.iloc[index]),
            "macd": _optional_number(macd.iloc[index]),
            "macd_signal": _optional_number(macd_signal.iloc[index]),
        }
        for index, timestamp in enumerate(history.index)
    ]


def fetch_quote(symbol: str) -> dict:
    ticker = yf.Ticker(symbol)
    history = ticker.history(period="2d", auto_adjust=False, actions=False)

    if history.empty:
        raise ValueError(f"No market data returned for {symbol}")

    last_close = float(history["Close"].iloc[-1])
    prev_close = float(history["Close"].iloc[-2]) if len(history) > 1 else last_close

    # Guard against NaN values returned by yfinance
    if math.isnan(last_close):
        raise ValueError(f"No valid price data for {symbol}")

    if math.isnan(prev_close):
        # If only previous close is missing (e.g. first trading day), do not fail;
        # report day_change_percent as None so JSON serializes to null.
        day_change_percent = None
    else:
        # Preserve existing behavior for zero previous close (avoid division by zero)
        day_change_percent = (
            round(((last_close - prev_close) / prev_close) * 100, 4) if prev_close else 0.0
        )

    volume = int(history["Volume"].iloc[-1]) if "Volume" in history.columns else None

    return {
        "symbol": symbol.upper(),
        "price": round(last_close, 4),
        "day_change_percent": day_change_percent,
        "volume": volume,
        "fetched_at": datetime.utcnow().isoformat(),
    }


def fetch_indices() -> list[dict]:
    return [
        {"label": label, **fetch_quote(symbol)}
        for symbol, label in MARKET_INDICES.items()
    ]


def fetch_news(symbol: str) -> list[dict]:
    ticker = yf.Ticker(symbol)
    raw_news = ticker.news or []
    results: list[dict] = []

    for item in raw_news:
        content = item.get("content") or {}
        provider = content.get("provider") or {}
        canonical_url = content.get("canonicalUrl") or {}
        click_url = content.get("clickThroughUrl") or {}

        published_timestamp = item.get("providerPublishTime") or content.get("pubDate")
        if isinstance(published_timestamp, (int, float)):
            published_at = datetime.fromtimestamp(published_timestamp, tz=timezone.utc).replace(tzinfo=None)
        elif published_timestamp:
            published_at = datetime.fromisoformat(str(published_timestamp).replace("Z", "+00:00")).replace(tzinfo=None)
        else:
            published_at = datetime.utcnow()

        title = item.get("title") or content.get("title") or f"{symbol.upper()} market news"
        source = item.get("publisher") or item.get("source") or provider.get("displayName") or "Yahoo Finance"
        url = item.get("link") or canonical_url.get("url") or click_url.get("url")
        content_text = content.get("summary") or content.get("description") or item.get("summary") or item.get("description") or ""

        if not url:
            continue

        results.append(
            {
                "title": title,
                "source": source,
                "url": url,
                "content": content_text,
                "published_at": published_at.isoformat(),
            }
        )

    return results


def ingest_watchlist_data(symbols: list[str], db: Session) -> dict[str, Any]:
    symbols_processed = 0
    articles_added = 0
    embeddings_created = 0

    for symbol in symbols:
        quote = fetch_quote(symbol)
        market_record = MarketData(
            symbol=symbol.upper(),
            price=quote["price"],
            day_change_percent=quote["day_change_percent"],
            volume=quote["volume"],
            fetched_at=datetime.utcnow(),
        )
        db.add(market_record)

        for item in fetch_news(symbol):
            article_url = item.get("url")
            if not article_url:
                continue

            existing_article = db.query(NewsArticle).filter(NewsArticle.url == article_url).first()
            if existing_article:
                continue

            article = NewsArticle(
                title=item.get("title") or symbol.upper(),
                source=item.get("source") or "Yahoo Finance",
                url=article_url,
                content=item.get("content") or "",
                published_at=datetime.fromisoformat(item.get("published_at") or datetime.utcnow().isoformat()),
                symbol=symbol.upper(),
            )
            db.add(article)
            db.flush()
            articles_added += 1

            chunks = chunk_article(article.title, article.content)
            for chunk_text in chunks:
                vector = embed_text(chunk_text)
                upsert_news_embedding(
                    article_id=str(article.id),
                    chunk_text=chunk_text,
                    vector=vector,
                    payload={
                        "symbol": symbol.upper(),
                        "title": article.title,
                        "source": article.source,
                        "url": article.url,
                        "published_at": article.published_at.isoformat(),
                    },
                )
                embeddings_created += 1

        symbols_processed += 1

    db.commit()
    return {
        "symbols_processed": symbols_processed,
        "articles_added": articles_added,
        "embeddings_created": embeddings_created,
    }


def run_watchlist_ingestion() -> dict[str, Any]:
    db = SessionLocal()
    try:
        result = ingest_watchlist_data(WATCHLIST_SYMBOLS, db)
        print(f"Market ingestion completed: {result}", flush=True)
        return result
    finally:
        db.close()
