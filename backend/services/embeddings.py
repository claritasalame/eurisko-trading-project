from typing import Optional

from openai import OpenAI

from config import OPENAI_API_KEY

def embed_text(text: str) -> list[float]:
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not configured.")

    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding


def chunk_article(title: str, content: Optional[str]) -> list[str]:
    cleaned_title = (title or "").strip()
    if not cleaned_title:
        return []

    raw_content = (content or "").strip()
    if not raw_content:
        return [cleaned_title]

    # Roughly four characters per token. Short articles are represented by their
    # title; longer content is divided into approximately 500-token chunks.
    if len(raw_content) <= 2000:
        return [cleaned_title]

    chunks: list[str] = []
    words = raw_content.split()
    current: list[str] = []
    current_length = 0
    for word in words:
        if current and current_length + len(word) + 1 > 2000:
            chunks.append(" ".join(current))
            current = []
            current_length = 0
        current.append(word)
        current_length += len(word) + 1
    if current:
        chunks.append(" ".join(current))

    return chunks or [cleaned_title]
