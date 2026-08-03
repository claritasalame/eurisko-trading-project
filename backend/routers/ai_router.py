from fastapi import APIRouter

from schemas import AIQueryRequest, AIQueryResponse, NewsSearchRequest, NewsSearchResponse
from services.embeddings import embed_text
from services.qdrant_client import search_news

router = APIRouter()


@router.post("/query", response_model=AIQueryResponse)
def query_ai(payload: AIQueryRequest):
    return {
        "answer": f"This is a placeholder AI response for: {payload.query}",
        "status": "ok",
    }


@router.post("/search-news", response_model=NewsSearchResponse)
def search_articles(payload: NewsSearchRequest):
    query_vector = embed_text(payload.query)
    matches = search_news(query_vector=query_vector, symbol=payload.symbol, top_k=5)
    return {"results": matches}
