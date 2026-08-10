from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import NewsArticle
from schemas import NewsArticleResponse

router = APIRouter()


@router.get("/articles", response_model=list[NewsArticleResponse])
def get_articles(limit: int = Query(20, ge=1, le=50), db: Session = Depends(get_db)):
    return db.query(NewsArticle).order_by(NewsArticle.published_at.desc()).limit(limit).all()
