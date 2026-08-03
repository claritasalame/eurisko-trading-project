from fastapi import APIRouter

from schemas import NewsArticleResponse

router = APIRouter()


@router.get("/articles", response_model=list[NewsArticleResponse])
def get_articles():
    return [
        {
            "id": "55555555-5555-5555-5555-555555555555",
            "title": "Placeholder news article",
            "source": "example",
            "url": "https://example.com/news/1",
            "content": "Mock news article content for milestone 1 scaffolding.",
            "published_at": "2026-08-03T00:00:00Z",
            "created_at": "2026-08-03T00:00:00Z",
        }
    ]
