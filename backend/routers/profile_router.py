from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from database import get_db
from models import Holding, User, UserProfile
from schemas import HoldingCreate, HoldingResponse, PortfolioSummaryResponse, UserProfileResponse, UserProfileUpdate
from services.auth import get_current_user
from services.portfolio import build_portfolio_snapshot

router = APIRouter()


@router.get("/{user_id}/summary", response_model=PortfolioSummaryResponse)
def get_portfolio_summary(user_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_own_user(user_id, current_user)
    return build_portfolio_snapshot(current_user.id, db)


def get_or_create_profile(user_id: UUID, db: Session) -> UserProfile:
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if profile is None:
        profile = UserProfile(user_id=user_id, cash_balance=0.0)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def require_own_user(user_id: UUID, current_user: User) -> None:
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You cannot access another user's profile")


@router.get("/{user_id}", response_model=UserProfileResponse)
def get_profile(user_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_own_user(user_id, current_user)
    return get_or_create_profile(current_user.id, db)


@router.put("/{user_id}", response_model=UserProfileResponse)
def update_profile(user_id: UUID, payload: UserProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_own_user(user_id, current_user)
    profile = get_or_create_profile(current_user.id, db)
    for field, value in payload.model_dump().items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/{user_id}/holdings", response_model=list[HoldingResponse])
def get_holdings(user_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_own_user(user_id, current_user)
    return db.query(Holding).filter(Holding.user_id == current_user.id).order_by(Holding.created_at).all()


@router.post("/{user_id}/holdings", response_model=HoldingResponse, status_code=status.HTTP_201_CREATED)
def add_holding(user_id: UUID, payload: HoldingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_own_user(user_id, current_user)
    holding = Holding(
        user_id=current_user.id,
        symbol=payload.symbol.strip().upper(),
        quantity=payload.quantity,
        average_cost_basis=payload.average_cost_basis,
    )
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return holding


@router.delete("/{user_id}/holdings/{holding_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_holding(user_id: UUID, holding_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_own_user(user_id, current_user)
    holding = (
        db.query(Holding)
        .filter(Holding.id == holding_id, Holding.user_id == current_user.id)
        .first()
    )
    if holding is None:
        raise HTTPException(status_code=404, detail="Holding not found")
    db.delete(holding)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
