from typing import Any

from openai import OpenAI
from sqlalchemy.orm import Session

from config import OPENAI_API_KEY
from models import ChatMessage, ChatSession, Holding, UserProfile
from services.embeddings import embed_text
from services.market_data import fetch_quote
from services.qdrant_client import search_news


SYSTEM_PROMPT = """You are a market analysis assistant. Answer only from the supplied news, live quote, and user portfolio context. Do not rely on unstated knowledge or invent facts. If the context is insufficient, clearly say so. Cite the numbered news context item(s) supporting each news-based factual claim using [1], [2], etc. Treat quotes and portfolio calculations as live structured market data and distinguish them from published news. You may reference the user's actual cash, profile, and holdings when relevant. Frame portfolio-specific output as informational and educational analysis, not direct trade instructions. Prefer language such as 'given your risk tolerance and current holdings, this data suggests' rather than 'you should buy'. If the user has not set up a profile, say that plainly rather than guessing. Be concise."""


def build_context_prompt(
    query: str,
    news_items: list[dict],
    quote: dict | None,
    user_context: str | None = None,
    conversation_context: str | None = None,
) -> str:
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

    if user_context is not None:
        sections.extend(["", "User profile and portfolio context:", user_context])

    if conversation_context:
        sections.extend(["", "Prior conversation context:", conversation_context])

    sections.extend(["", "Answer the user using only this context and cite relevant numbered items."])
    return "\n".join(sections)


def build_conversation_context(user_id, db: Session) -> str | None:
    messages = (
        db.query(ChatMessage)
        .join(ChatSession, ChatMessage.chat_session_id == ChatSession.id)
        .filter(ChatSession.user_id == user_id)
        .order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc())
        .limit(20)
        .all()
    )
    if not messages:
        return None

    chronological = list(reversed(messages))
    older = chronological[:-10]
    recent = chronological[-10:]
    sections: list[str] = []
    if older:
        older_user_topics = [message.content.strip().replace("\n", " ")[:80] for message in older if message.role == "user"]
        if older_user_topics:
            sections.append("Earlier topics included: " + "; ".join(older_user_topics[:4]))
        else:
            sections.append("There are additional older conversation messages not shown here.")
    sections.append("Recent messages:")
    for message in recent:
        sections.append(f"{message.role.title()}: {message.content.strip()[:600]}")
    return "\n".join(sections)


def build_user_context(user_id, db: Session) -> str:
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    holdings = db.query(Holding).filter(Holding.user_id == user_id).order_by(Holding.created_at).all()

    if profile is None:
        sections = ["Profile status: not set up. Cash balance, risk tolerance, goals, and experience are unknown."]
    else:
        sections = [
            "Profile status: configured.",
            f"Cash balance: ${profile.cash_balance:,.2f}",
            f"Risk tolerance: {profile.risk_tolerance or 'not provided'}",
            f"Investment goals: {profile.investment_goals or 'not provided'}",
            f"Experience level: {profile.experience_level or 'not provided'}",
        ]

    sections.extend(["", "Holdings:", "Symbol | Quantity | Cost basis | Current price | Unrealized gain/loss"])
    if not holdings:
        sections.append("No holdings recorded.")
        return "\n".join(sections)

    for holding in holdings:
        try:
            holding_quote = fetch_quote(holding.symbol)
            current_price = holding_quote["price"]
            unrealized_amount = (current_price - holding.average_cost_basis) * holding.quantity
            unrealized_percent = (
                ((current_price - holding.average_cost_basis) / holding.average_cost_basis) * 100
                if holding.average_cost_basis
                else 0.0
            )
            sections.append(
                f"{holding.symbol} | {holding.quantity:g} | ${holding.average_cost_basis:,.2f} | "
                f"${current_price:,.2f} | ${unrealized_amount:,.2f} ({unrealized_percent:+.2f}%)"
            )
        except Exception as exc:
            sections.append(
                f"{holding.symbol} | {holding.quantity:g} | ${holding.average_cost_basis:,.2f} | "
                f"unavailable | unavailable (quote error: {type(exc).__name__})"
            )
    return "\n".join(sections)


def answer_query(query: str, symbol: str | None, db: Session, user_id=None) -> dict[str, Any]:
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not configured.")

    normalized_symbol = symbol.upper() if symbol else None
    query_vector = embed_text(query)
    news_items = search_news(query_vector, symbol=normalized_symbol, top_k=5)
    quote = fetch_quote(normalized_symbol) if normalized_symbol else None
    user_context = build_user_context(user_id, db) if user_id is not None else None
    conversation_context = build_conversation_context(user_id, db) if user_id is not None else None
    prompt = build_context_prompt(query, news_items, quote, user_context, conversation_context)

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
