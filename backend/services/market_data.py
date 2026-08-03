from datetime import datetime, timezone
from typing import Any

import yfinance as yf
from sqlalchemy.orm import Session

from database import SessionLocal
from models import MarketData, NewsArticle
from services.embeddings import chunk_article, embed_text
from services.qdrant_client import upsert_news_embedding

WATCHLIST_SYMBOLS = ["AAPL", "MSFT", "NVDA", "TSLA", "GOOGL"]


def fetch_quote(symbol: str) -> dict:
    ticker = yf.Ticker(symbol)
    history = ticker.history(period="2d", auto_adjust=False, actions=False)

    if history.empty:
        raise ValueError(f"No market data returned for {symbol}")

    last_close = float(history["Close"].iloc[-1])
    prev_close = float(history["Close"].iloc[-2]) if len(history) > 1 else last_close
    day_change_percent = round(((last_close - prev_close) / prev_close) * 100, 4) if prev_close else 0.0
    volume = int(history["Volume"].iloc[-1]) if "Volume" in history.columns else None

    return {
        "symbol": symbol.upper(),
        "price": round(last_close, 4),
        "day_change_percent": day_change_percent,
        "volume": volume,
        "fetched_at": datetime.utcnow().isoformat(),
    }


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
        return ingest_watchlist_data(WATCHLIST_SYMBOLS, db)
    finally:
        db.close()
