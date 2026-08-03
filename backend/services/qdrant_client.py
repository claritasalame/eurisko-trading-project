import uuid

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from config import QDRANT_URL

client = QdrantClient(url=QDRANT_URL)

COLLECTION_NAME = "news_embeddings"
VECTOR_SIZE = 1536


def ensure_news_collection() -> None:
    collections = client.get_collections().collections
    exists = any(collection.name == COLLECTION_NAME for collection in collections)

    if not exists:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=qmodels.VectorParams(size=VECTOR_SIZE, distance=qmodels.Distance.COSINE),
        )


def upsert_news_embedding(article_id: str, chunk_text: str, vector: list[float], payload: dict) -> dict:
    ensure_news_collection()
    point_id = str(uuid.uuid5(uuid.UUID(article_id), chunk_text))
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            qmodels.PointStruct(
                id=point_id,
                vector=vector,
                payload={"chunk_text": chunk_text, **payload},
            )
        ],
    )
    return {"status": "ok", "article_id": article_id, "collection": COLLECTION_NAME}


def search_news(query_vector: list[float], symbol: str | None = None, top_k: int = 5) -> list[dict]:
    ensure_news_collection()
    filter_condition = None
    if symbol:
        filter_condition = qmodels.Filter(
            must=[qmodels.FieldCondition(key="symbol", match=qmodels.MatchValue(value=symbol.upper()))]
        )

    results = client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        query_filter=filter_condition,
        limit=top_k,
        with_payload=True,
    )

    return [
        {
            "relevance_score": float(point.score),
            "title": point.payload.get("title"),
            "source": point.payload.get("source"),
            "url": point.payload.get("url"),
            "published_at": point.payload.get("published_at"),
            "symbol": point.payload.get("symbol"),
        }
        for point in results
    ]
