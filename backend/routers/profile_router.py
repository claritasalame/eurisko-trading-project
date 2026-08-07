from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from database import get_db
from models import Holding, User, UserProfile
from schemas import HoldingCreate, HoldingResponse, UserProfileResponse, UserProfileUpdate

router = APIRouter()


def ensure_demo_user(user_id: UUID, db: Session) -> User:
    user = db.get(User, user_id)
    if user is None:
        user = User(id=user_id, email=f"demo-{user_id}@local.invalid", password="demo-user-no-login")
        db.add(user)
        db.flush()
    return user


def get_or_create_profile(user_id: UUID, db: Session) -> UserProfile:
    ensure_demo_user(user_id, db)
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if profile is None:
        profile = UserProfile(user_id=user_id, cash_balance=0.0)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("/{user_id}", response_model=UserProfileResponse)
def get_profile(user_id: UUID, db: Session = Depends(get_db)):
    return get_or_create_profile(user_id, db)


@router.put("/{user_id}", response_model=UserProfileResponse)
def update_profile(user_id: UUID, payload: UserProfileUpdate, db: Session = Depends(get_db)):
    profile = get_or_create_profile(user_id, db)
    for field, value in payload.model_dump().items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/{user_id}/holdings", response_model=list[HoldingResponse])
def get_holdings(user_id: UUID, db: Session = Depends(get_db)):
    ensure_demo_user(user_id, db)
    db.commit()
    return db.query(Holding).filter(Holding.user_id == user_id).order_by(Holding.created_at).all()


@router.post("/{user_id}/holdings", response_model=HoldingResponse, status_code=status.HTTP_201_CREATED)
def add_holding(user_id: UUID, payload: HoldingCreate, db: Session = Depends(get_db)):
    ensure_demo_user(user_id, db)
    holding = Holding(
        user_id=user_id,
        symbol=payload.symbol.strip().upper(),
        quantity=payload.quantity,
        average_cost_basis=payload.average_cost_basis,
    )
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return holding


@router.delete("/{user_id}/holdings/{holding_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_holding(user_id: UUID, holding_id: UUID, db: Session = Depends(get_db)):
    holding = (
        db.query(Holding)
        .filter(Holding.id == holding_id, Holding.user_id == user_id)
        .first()
    )
    if holding is None:
        raise HTTPException(status_code=404, detail="Holding not found")
    db.delete(holding)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
