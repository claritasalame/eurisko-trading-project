from typing import Any

from openai import OpenAI
from sqlalchemy.orm import Session

from config import OPENAI_API_KEY
from services.embeddings import embed_text
from services.market_data import fetch_quote
from services.qdrant_client import search_news


SYSTEM_PROMPT = """You are a market analysis assistant. Answer only from the supplied news and live quote context. Do not rely on unstated knowledge or invent facts. If the context is insufficient, clearly say so. Cite the numbered news context item(s) supporting each factual claim using [1], [2], etc. Treat the quote as live structured market data and distinguish it from published news. Be concise and do not give personalized financial advice."""


def build_context_prompt(query: str, news_items: list[dict], quote: dict | None) -> str:
    sections = [f"User question: {query}", "", "Retrieved news context:"]
    if news_items:
        for index, item in enumerate(news_items, start=1):
            sections.extend(
                [
                    f"[{index}] {item.get('title') or 'Untitled'}",
                    f"Source: {item.get('source') or 'Unknown'}",
                    f"Published: {item.get('published_at') or 'Unknown'}",
                    f"Snippet: {item.get('snippet') or item.get('title') or 'No snippet available'}",
                    "",
                ]
            )
    else:
        sections.append("No relevant news was retrieved.")

    sections.extend(["", "Live quote context:"])
    if quote:
        direction = "up" if quote["day_change_percent"] >= 0 else "down"
        sections.append(
            f"{quote['symbol']} is currently trading at ${quote['price']:.2f}, "
            f"{direction} {abs(quote['day_change_percent']):.2f}% today, with volume "
            f"{quote.get('volume') if quote.get('volume') is not None else 'unavailable'}."
        )
    else:
        sections.append("No live quote was requested.")

    sections.extend(["", "Answer the user using only this context and cite relevant numbered items."])
    return "\n".join(sections)


def answer_query(query: str, symbol: str | None, db: Session) -> dict[str, Any]:
    del db  # Reserved for database-backed context expansion.
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not configured.")

    normalized_symbol = symbol.upper() if symbol else None
    query_vector = embed_text(query)
    news_items = search_news(query_vector, symbol=normalized_symbol, top_k=5)
    quote = fetch_quote(normalized_symbol) if normalized_symbol else None
    prompt = build_context_prompt(query, news_items, quote)

    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )
    answer = response.choices[0].message.content or "I don't have enough information to answer that."

    sources = []
    seen_urls: set[str] = set()
    for item in news_items:
        url = item.get("url")
        if not url or url in seen_urls:
            continue
        seen_urls.add(url)
        sources.append({"title": item.get("title"), "url": url, "source": item.get("source")})

    return {"answer": answer, "sources": sources, "quote": quote}
