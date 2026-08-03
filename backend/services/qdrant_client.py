from qdrant_client import QdrantClient

from config import QDRANT_URL

client = QdrantClient(url=QDRANT_URL)


def upsert_news_article_embedding(article: dict) -> dict:
    """TODO: implement embedding + upsert into Qdrant collection."""
    return {
        "status": "not_implemented",
        "article": article.get("title"),
    }
