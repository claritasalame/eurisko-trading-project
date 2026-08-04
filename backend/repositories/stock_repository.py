from __future__ import annotations

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

try:
    from models import Stock
except ModuleNotFoundError:  # pragma: no cover - supports imports from project root
    from backend.models import Stock

from .base_repository import BaseRepository


class StockRepository(BaseRepository[Stock]):
    def __init__(self, session: Session):
        super().__init__(session, Stock)

    def get_by_symbol(self, symbol: str) -> Stock | None:
        normalized_symbol = symbol.strip().lower()
        return self.session.scalar(
            select(Stock).where(func.lower(Stock.symbol) == normalized_symbol)
        )

    def get_or_create(self, symbol: str, defaults: dict[str, Any] | None = None) -> tuple[Stock, bool]:
        normalized_symbol = symbol.strip().upper()
        existing_stock = self.get_by_symbol(normalized_symbol)
        if existing_stock is not None:
            return existing_stock, False

        payload: dict[str, Any] = {"symbol": normalized_symbol}
        if defaults:
            payload.update(defaults)

        stock = Stock(**payload)
        self.create(stock)
        return stock, True

    def update_metadata(self, stock_id: Any, **fields: Any) -> Stock | None:
        stock = self.get_by_id(stock_id)
        if stock is None:
            return None

        allowed_fields = {
            "name",
            "exchange",
            "currency",
            "sector",
            "industry",
            "country",
            "market_cap",
            "website",
        }

        for field_name, value in fields.items():
            if field_name in allowed_fields:
                setattr(stock, field_name, value)

        self.session.flush()
        return stock

    def list_active(self) -> list[Stock]:
        return self.session.scalars(
            select(Stock).where(Stock.is_active.is_(True)).order_by(Stock.symbol)
        ).all()
