from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import NewsArticle
from schemas import NewsArticleResponse

router = APIRouter()


@router.get("/articles", response_model=list[NewsArticleResponse])
def get_articles(
    limit: int = Query(20, ge=1, le=50),
    symbol: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(NewsArticle).order_by(NewsArticle.published_at.desc())
    if symbol:
        query = query.filter(NewsArticle.symbol == symbol.upper())
    return query.limit(limit).all()
