from __future__ import annotations

from typing import Generic, Type, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

try:
    from database import Base
except ModuleNotFoundError:  # pragma: no cover - supports imports from project root
    from backend.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, session: Session, model: Type[ModelType]):
        self.session = session
        self.model = model

    def get_by_id(self, id: object) -> ModelType | None:
        return self.session.get(self.model, id)

    def get_all(self, limit: int = 100, offset: int = 0) -> list[ModelType]:
        return self.session.scalars(select(self.model).offset(offset).limit(limit)).all()

    def create(self, obj: ModelType) -> ModelType:
        self.session.add(obj)
        self.session.flush()
        return obj

    def delete(self, id: object) -> bool:
        obj = self.get_by_id(id)
        if obj is None:
            return False

        self.session.delete(obj)
        self.session.flush()
        return True
