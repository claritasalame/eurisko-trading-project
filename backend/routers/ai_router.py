from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas import AIQueryRequest, AIQueryResponse, NewsSearchRequest, NewsSearchResponse
from services.copilot import answer_query
from services.embeddings import embed_text
from services.qdrant_client import search_news

router = APIRouter()


@router.post("/query", response_model=AIQueryResponse)
def query_ai(payload: AIQueryRequest, db: Session = Depends(get_db)):
    return answer_query(payload.query, payload.symbol, db, user_id=payload.user_id)


@router.post("/search-news", response_model=NewsSearchResponse)
def search_articles(payload: NewsSearchRequest):
    query_vector = embed_text(payload.query)
    matches = search_news(query_vector=query_vector, symbol=payload.symbol, top_k=5)
    return {"results": matches}
