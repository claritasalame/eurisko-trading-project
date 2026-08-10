from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import ChatMessage, ChatSession, Holding, User
from routers.profile_router import get_or_create_profile
from schemas import AdminProfileResponse, AdminUserResponse, ChatMessageResponse, ChatSessionResponse
from services.auth import get_current_admin

router = APIRouter(dependencies=[Depends(get_current_admin)])


def require_user(user_id: UUID, db: Session) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/users", response_model=list[AdminUserResponse])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.get("/users/{user_id}/sessions", response_model=list[ChatSessionResponse])
def list_user_sessions(user_id: UUID, db: Session = Depends(get_db)):
    require_user(user_id, db)
    return db.query(ChatSession).filter(ChatSession.user_id == user_id).order_by(ChatSession.created_at.desc()).all()


@router.get("/users/{user_id}/sessions/{session_id}/messages", response_model=list[ChatMessageResponse])
def list_session_messages(user_id: UUID, session_id: UUID, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == user_id).first()
    if session is None:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return db.query(ChatMessage).filter(ChatMessage.chat_session_id == session_id).order_by(ChatMessage.created_at, ChatMessage.id).all()


@router.get("/users/{user_id}/profile", response_model=AdminProfileResponse)
def get_user_profile(user_id: UUID, db: Session = Depends(get_db)):
    require_user(user_id, db)
    profile = get_or_create_profile(user_id, db)
    holdings = db.query(Holding).filter(Holding.user_id == user_id).order_by(Holding.created_at).all()
    return {"profile": profile, "holdings": holdings}
