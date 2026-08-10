from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserProfile
from schemas import AuthToken, UserCreate, UserResponse
from services.auth import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter()


@router.post("/register", response_model=AuthToken, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=422, detail="Enter a valid email address")
    if len(payload.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
    if db.query(User).filter(User.email == email).first() is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(email=email, password=hash_password(payload.password))
    db.add(user)
    db.flush()
    db.add(UserProfile(user_id=user.id, cash_balance=0.0))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")
    db.refresh(user)
    return {"access_token": create_access_token(user), "token_type": "bearer"}


@router.post("/login", response_model=AuthToken)
def login_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if user is None or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"access_token": create_access_token(user), "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
