from __future__ import annotations

from typing import Any

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

try:
    from models import TechnicalIndicator, utcnow
except ModuleNotFoundError:  # pragma: no cover - supports imports from project root
    from backend.models import TechnicalIndicator, utcnow

from .base_repository import BaseRepository


class TechnicalIndicatorRepository(BaseRepository[TechnicalIndicator]):
    def __init__(self, session: Session):
        super().__init__(session, TechnicalIndicator)

    def bulk_upsert(self, stock_id: Any, rows: list[dict[str, Any] | TechnicalIndicator]) -> int:
        if not rows:
            return 0

        payloads: list[dict[str, Any]] = []
        for row in rows:
            if isinstance(row, TechnicalIndicator):
                payload = {
                    "stock_id": stock_id,
                    "date": row.date,
                    "rsi": row.rsi,
                    "sma_20": row.sma_20,
                    "sma_50": row.sma_50,
                    "ema_20": row.ema_20,
                    "ema_50": row.ema_50,
                    "macd": row.macd,
                    "macd_signal": row.macd_signal,
                    "macd_histogram": row.macd_histogram,
                    "bollinger_upper": row.bollinger_upper,
                    "bollinger_middle": row.bollinger_middle,
                    "bollinger_lower": row.bollinger_lower,
                    "atr": row.atr,
                    "adx": row.adx,
                    "obv": row.obv,
                }
            else:
                payload = dict(row)
                payload["stock_id"] = stock_id

            payloads.append(payload)

        stmt = insert(TechnicalIndicator).values(payloads)
        stmt = stmt.on_conflict_do_update(
            index_elements=[TechnicalIndicator.stock_id, TechnicalIndicator.date],
            set_={
                "rsi": stmt.excluded.rsi,
                "sma_20": stmt.excluded.sma_20,
                "sma_50": stmt.excluded.sma_50,
                "ema_20": stmt.excluded.ema_20,
                "ema_50": stmt.excluded.ema_50,
                "macd": stmt.excluded.macd,
                "macd_signal": stmt.excluded.macd_signal,
                "macd_histogram": stmt.excluded.macd_histogram,
                "bollinger_upper": stmt.excluded.bollinger_upper,
                "bollinger_middle": stmt.excluded.bollinger_middle,
                "bollinger_lower": stmt.excluded.bollinger_lower,
                "atr": stmt.excluded.atr,
                "adx": stmt.excluded.adx,
                "obv": stmt.excluded.obv,
                "updated_at": utcnow(),
            },
        )

        result = self.session.execute(stmt)
        self.session.flush()
        return int(result.rowcount if result.rowcount is not None else len(payloads))

    def get_latest(self, stock_id: Any) -> TechnicalIndicator | None:
        return (
            self.session.query(TechnicalIndicator)
            .filter(TechnicalIndicator.stock_id == stock_id)
            .order_by(TechnicalIndicator.date.desc())
            .first()
        )

    def get_range(self, stock_id: Any, start_date: Any, end_date: Any) -> list[TechnicalIndicator]:
        return (
            self.session.query(TechnicalIndicator)
            .filter(
                TechnicalIndicator.stock_id == stock_id,
                TechnicalIndicator.date >= start_date,
                TechnicalIndicator.date <= end_date,
            )
            .order_by(TechnicalIndicator.date.asc())
            .all()
        )
