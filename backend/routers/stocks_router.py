from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

try:
    from database import get_db
    from repositories.historical_price_repository import HistoricalPriceRepository
    from repositories.stock_repository import StockRepository
    from repositories.technical_indicator_repository import TechnicalIndicatorRepository
except ModuleNotFoundError:  # pragma: no cover - supports imports from project root
    from backend.database import get_db
    from backend.repositories.historical_price_repository import HistoricalPriceRepository
    from backend.repositories.stock_repository import StockRepository
    from backend.repositories.technical_indicator_repository import TechnicalIndicatorRepository

from schemas import HistoricalPriceResponse, StockResponse, TechnicalIndicatorResponse

router = APIRouter()


def _resolve_date_range(start_date: date | None, end_date: date | None) -> tuple[date, date]:
    effective_end_date = end_date or date.today()
    effective_start_date = start_date or effective_end_date - timedelta(days=90)
    return effective_start_date, effective_end_date


@router.get("/", response_model=list[StockResponse])
def list_stocks(db: Session = Depends(get_db)):
    return StockRepository(db).list_active()


@router.get("/{symbol}", response_model=StockResponse)
def get_stock(symbol: str, db: Session = Depends(get_db)):
    stock = StockRepository(db).get_by_symbol(symbol)
    if stock is None:
        raise HTTPException(status_code=404, detail=f"Stock '{symbol}' not found")
    return stock


@router.get("/{symbol}/prices", response_model=list[HistoricalPriceResponse])
def get_stock_prices(
    symbol: str,
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    stock = StockRepository(db).get_by_symbol(symbol)
    if stock is None:
        raise HTTPException(status_code=404, detail=f"Stock '{symbol}' not found")

    effective_start_date, effective_end_date = _resolve_date_range(start_date, end_date)
    return HistoricalPriceRepository(db).get_price_range(stock.id, effective_start_date, effective_end_date)


@router.get("/{symbol}/indicators/latest", response_model=TechnicalIndicatorResponse)
def get_latest_indicator(symbol: str, db: Session = Depends(get_db)):
    stock = StockRepository(db).get_by_symbol(symbol)
    if stock is None:
        raise HTTPException(status_code=404, detail=f"Stock '{symbol}' not found")

    indicator = TechnicalIndicatorRepository(db).get_latest(stock.id)
    if indicator is None:
        raise HTTPException(status_code=404, detail=f"No indicators found for '{symbol}'")
    return indicator


@router.get("/{symbol}/indicators", response_model=list[TechnicalIndicatorResponse])
def get_stock_indicators(
    symbol: str,
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    stock = StockRepository(db).get_by_symbol(symbol)
    if stock is None:
        raise HTTPException(status_code=404, detail=f"Stock '{symbol}' not found")

    effective_start_date, effective_end_date = _resolve_date_range(start_date, end_date)
    return TechnicalIndicatorRepository(db).get_range(stock.id, effective_start_date, effective_end_date)
