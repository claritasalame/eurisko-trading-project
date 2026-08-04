from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

try:
    from models import HistoricalPrice, utcnow
except ModuleNotFoundError:  # pragma: no cover - supports imports from project root
    from backend.models import HistoricalPrice, utcnow

from .base_repository import BaseRepository


class HistoricalPriceRepository(BaseRepository[HistoricalPrice]):
    def __init__(self, session: Session):
        super().__init__(session, HistoricalPrice)

    def bulk_upsert(self, stock_id: Any, rows: list[dict[str, Any] | HistoricalPrice]) -> int:
        if not rows:
            return 0

        payloads: list[dict[str, Any]] = []
        for row in rows:
            if isinstance(row, HistoricalPrice):
                payload = {
                    "stock_id": stock_id,
                    "date": row.date,
                    "open": row.open,
                    "high": row.high,
                    "low": row.low,
                    "close": row.close,
                    "adjusted_close": row.adjusted_close,
                    "volume": row.volume,
                }
            else:
                payload = dict(row)
                payload["stock_id"] = stock_id

            payloads.append(payload)

        stmt = insert(HistoricalPrice).values(payloads)
        stmt = stmt.on_conflict_do_update(
            index_elements=[HistoricalPrice.stock_id, HistoricalPrice.date],
            set_={
                "open": stmt.excluded.open,
                "high": stmt.excluded.high,
                "low": stmt.excluded.low,
                "close": stmt.excluded.close,
                "adjusted_close": stmt.excluded.adjusted_close,
                "volume": stmt.excluded.volume,
                "updated_at": utcnow(),
            },
        )

        result = self.session.execute(stmt)
        self.session.flush()
        return int(result.rowcount if result.rowcount is not None else len(payloads))

    def get_price_range(self, stock_id: Any, start_date: Any, end_date: Any) -> list[HistoricalPrice]:
        return (
            self.session.query(HistoricalPrice)
            .filter(
                HistoricalPrice.stock_id == stock_id,
                HistoricalPrice.date >= start_date,
                HistoricalPrice.date <= end_date,
            )
            .order_by(HistoricalPrice.date.asc())
            .all()
        )

    def get_latest(self, stock_id: Any) -> HistoricalPrice | None:
        return (
            self.session.query(HistoricalPrice)
            .filter(HistoricalPrice.stock_id == stock_id)
            .order_by(HistoricalPrice.date.desc())
            .first()
        )
