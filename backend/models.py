import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


def utcnow() -> datetime:
    """Timezone-aware UTC now, used only by the stock/price/indicator tables.
    Existing tables above keep naive datetime.utcnow for consistency with their
    original design - do not change them."""
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    chat_sessions = relationship("ChatSession", back_populates="user")
    watchlists = relationship("Watchlist", back_populates="user")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="chat_session")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    chat_session = relationship("ChatSession", back_populates="messages")


class MarketData(Base):
    __tablename__ = "market_data"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symbol = Column(String(32), nullable=False, index=True)
    price = Column(Float, nullable=False)
    day_change_percent = Column(Float, nullable=False)
    volume = Column(BigInteger, nullable=True)
    fetched_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class NewsArticle(Base):
    __tablename__ = "news_articles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    source = Column(String(255), nullable=False)
    url = Column(String(500), unique=True, nullable=False)
    content = Column(Text, nullable=True)
    published_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    symbol = Column(String(32), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="watchlists")

    __table_args__ = (
        UniqueConstraint("user_id", "symbol", name="uq_watchlists_user_symbol"),
    )


class Stock(Base):
    __tablename__ = "stocks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symbol = Column(String(32), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    exchange = Column(String(64), nullable=True)
    currency = Column(String(16), nullable=True)
    sector = Column(String(128), nullable=True)
    industry = Column(String(128), nullable=True)
    country = Column(String(128), nullable=True)
    market_cap = Column(BigInteger, nullable=True)
    website = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    historical_prices = relationship(
        "HistoricalPrice", back_populates="stock", cascade="all, delete-orphan"
    )
    technical_indicators = relationship(
        "TechnicalIndicator", back_populates="stock", cascade="all, delete-orphan"
    )


class HistoricalPrice(Base):
    __tablename__ = "historical_prices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stock_id = Column(UUID(as_uuid=True), ForeignKey("stocks.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    open = Column(Numeric(12, 4), nullable=False)
    high = Column(Numeric(12, 4), nullable=False)
    low = Column(Numeric(12, 4), nullable=False)
    close = Column(Numeric(12, 4), nullable=False)
    adjusted_close = Column(Numeric(12, 4), nullable=False)
    volume = Column(BigInteger, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    stock = relationship("Stock", back_populates="historical_prices")

    __table_args__ = (
        UniqueConstraint("stock_id", "date", name="uq_historical_prices_stock_date"),
        CheckConstraint("high >= low", name="ck_historical_prices_high_gte_low"),
        CheckConstraint(
            "open > 0 AND high > 0 AND low > 0 AND close > 0 AND adjusted_close > 0",
            name="ck_historical_prices_positive_prices",
        ),
        CheckConstraint("volume >= 0", name="ck_historical_prices_volume_nonneg"),
    )


class TechnicalIndicator(Base):
    __tablename__ = "technical_indicators"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stock_id = Column(UUID(as_uuid=True), ForeignKey("stocks.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    rsi = Column(Float, nullable=True)
    sma_20 = Column(Float, nullable=True)
    sma_50 = Column(Float, nullable=True)
    ema_20 = Column(Float, nullable=True)
    ema_50 = Column(Float, nullable=True)
    macd = Column(Float, nullable=True)
    macd_signal = Column(Float, nullable=True)
    macd_histogram = Column(Float, nullable=True)
    bollinger_upper = Column(Float, nullable=True)
    bollinger_middle = Column(Float, nullable=True)
    bollinger_lower = Column(Float, nullable=True)
    atr = Column(Float, nullable=True)
    adx = Column(Float, nullable=True)
    obv = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    stock = relationship("Stock", back_populates="technical_indicators")

    __table_args__ = (
        UniqueConstraint("stock_id", "date", name="uq_technical_indicators_stock_date"),
        CheckConstraint(
            "rsi IS NULL OR (rsi >= 0 AND rsi <= 100)", name="ck_technical_indicators_rsi_range"
        ),
        CheckConstraint(
            "adx IS NULL OR (adx >= 0 AND adx <= 100)", name="ck_technical_indicators_adx_range"
        ),
    )
