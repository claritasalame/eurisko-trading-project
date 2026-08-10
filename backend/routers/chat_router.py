from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import ChatMessage, ChatSession, User
from schemas import ChatAssistantResponse, ChatMessageCreate, ChatMessageResponse, ChatSessionCreate, ChatSessionListResponse, ChatSessionResponse
from services.copilot import answer_query
from services.auth import get_current_user

router = APIRouter()


@router.get("/sessions", response_model=list[ChatSessionListResponse])
def list_chat_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = (
        db.query(ChatSession, func.max(ChatMessage.created_at).label("last_activity_at"))
        .outerjoin(ChatMessage, ChatMessage.chat_session_id == ChatSession.id)
        .filter(ChatSession.user_id == current_user.id)
        .group_by(ChatSession.id)
        .order_by(func.coalesce(func.max(ChatMessage.created_at), ChatSession.created_at).desc())
        .all()
    )
    sessions = []
    for chat_session, last_message_at in rows:
        first_user_message_row = (
            db.query(ChatMessage.content)
            .filter(ChatMessage.chat_session_id == chat_session.id, ChatMessage.role == "user")
            .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
            .first()
        )
        first_user_message = first_user_message_row[0] if first_user_message_row else None
        preview = (first_user_message or "New conversation").strip().replace("\n", " ")
        sessions.append({
            "id": chat_session.id,
            "user_id": chat_session.user_id,
            "created_at": chat_session.created_at,
            "preview": preview[:60] + ("…" if len(preview) > 60 else ""),
            "last_activity_at": last_message_at or chat_session.created_at,
        })
    return sessions


@router.post("/sessions", response_model=ChatSessionResponse)
def create_chat_session(payload: ChatSessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = ChatSession(user_id=current_user.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageResponse])
def get_session_messages(session_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    chat_session = db.get(ChatSession, session_id)
    if chat_session is None or chat_session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.chat_session_id == session_id)
        .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
        .all()
    )


@router.post("/sessions/{session_id}/messages", response_model=ChatAssistantResponse)
def create_session_message(session_id: UUID, payload: ChatMessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    chat_session = db.get(ChatSession, session_id)
    if chat_session is None or chat_session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Chat session not found")

    user_message = ChatMessage(chat_session_id=session_id, role="user", content=payload.content)
    db.add(user_message)
    result = answer_query(payload.content, payload.symbol, db, user_id=chat_session.user_id)
    assistant_message = ChatMessage(chat_session_id=session_id, role="assistant", content=result["answer"])
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)
    return {
        "id": assistant_message.id,
        "chat_session_id": assistant_message.chat_session_id,
        "role": assistant_message.role,
        "content": assistant_message.content,
        "created_at": assistant_message.created_at,
        **result,
    }
