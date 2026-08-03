from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    created_at: datetime


class AuthToken(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChatSessionCreate(BaseModel):
    user_id: Optional[UUID] = None


class ChatSessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    created_at: datetime


class ChatMessageCreate(BaseModel):
    content: str
    symbol: Optional[str] = None


class ChatMessageResponse(BaseModel):
    id: UUID
    chat_session_id: UUID
    role: str
    content: str
    created_at: datetime


class NewsArticleResponse(BaseModel):
    id: UUID
    title: str
    source: str
    url: str
    content: Optional[str] = None
    published_at: datetime
    created_at: datetime


class QuoteResponse(BaseModel):
    symbol: str
    price: float
    currency: str = "USD"


class IndicatorResponse(BaseModel):
    symbol: str
    indicators: dict


class AIQueryRequest(BaseModel):
    query: str
    symbol: Optional[str] = None


class CopilotSource(BaseModel):
    title: str
    url: str
    source: str


class CopilotQuote(BaseModel):
    symbol: str
    price: float
    day_change_percent: float
    volume: Optional[int] = None
    fetched_at: str


class AIQueryResponse(BaseModel):
    answer: str
    sources: List[CopilotSource]
    quote: Optional[CopilotQuote] = None


class ChatAssistantResponse(ChatMessageResponse):
    answer: str
    sources: List[CopilotSource]
    quote: Optional[CopilotQuote] = None


class NewsSearchRequest(BaseModel):
    query: str
    symbol: Optional[str] = None


class NewsSearchResult(BaseModel):
    title: str
    source: str
    url: str
    published_at: Optional[str] = None
    relevance_score: float
    symbol: Optional[str] = None


class NewsSearchResponse(BaseModel):
    results: List[NewsSearchResult]
