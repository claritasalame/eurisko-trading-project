from datetime import date, datetime
from typing import Literal, Optional, List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: str
    is_admin: bool
    created_at: datetime


class AdminUserResponse(UserResponse):
    pass


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
    day_change_percent: float
    volume: Optional[int] = None
    fetched_at: str
    currency: str = "USD"


class IndexQuoteResponse(BaseModel):
    symbol: str
    label: str
    price: float
    day_change_percent: float
    fetched_at: str


class IndicatorResponse(BaseModel):
    symbol: str
    indicators: dict


class MarketHistoryPoint(BaseModel):
    timestamp: datetime
    price: float
    sma: Optional[float] = None
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None


class AIQueryRequest(BaseModel):
    query: str
    symbol: Optional[str] = None
    user_id: Optional[UUID] = None


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


class StockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    symbol: str
    name: Optional[str] = None
    exchange: Optional[str] = None
    currency: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    market_cap: Optional[int] = None
    website: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class HistoricalPriceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    date: date
    open: float
    high: float
    low: float
    close: float
    adjusted_close: float
    volume: Optional[int] = None


class TechnicalIndicatorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    date: date
    rsi: Optional[float] = None
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    ema_20: Optional[float] = None
    ema_50: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_histogram: Optional[float] = None
    bollinger_upper: Optional[float] = None
    bollinger_middle: Optional[float] = None
    bollinger_lower: Optional[float] = None
    atr: Optional[float] = None
    adx: Optional[float] = None
    obv: Optional[float] = None


class NewsSearchResponse(BaseModel):
    results: List[NewsSearchResult]


class UserProfileUpdate(BaseModel):
    cash_balance: float
    risk_tolerance: Literal["conservative", "moderate", "aggressive"]
    investment_goals: str
    experience_level: Literal["beginner", "intermediate", "advanced"]


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID
    cash_balance: float
    risk_tolerance: Optional[str] = None
    investment_goals: Optional[str] = None
    experience_level: Optional[str] = None
    updated_at: datetime


class HoldingCreate(BaseModel):
    symbol: str = Field(min_length=1, max_length=32)
    quantity: float = Field(gt=0)
    average_cost_basis: float = Field(ge=0)


class HoldingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID
    symbol: str
    quantity: float
    average_cost_basis: float
    created_at: datetime


class PortfolioHoldingResponse(BaseModel):
    id: UUID
    symbol: str
    quantity: float
    average_cost_basis: float
    current_price: float
    day_change_percent: float
    market_value: float
    today_change: float


class PortfolioSummaryResponse(BaseModel):
    cash_balance: float
    risk_tolerance: Optional[str] = None
    portfolio_value: float
    today_change: float
    holdings: List[PortfolioHoldingResponse]


class ChatSessionListResponse(ChatSessionResponse):
    preview: str
    last_activity_at: datetime


class AdminProfileResponse(BaseModel):
    profile: Optional[UserProfileResponse] = None
    holdings: List[HoldingResponse]
