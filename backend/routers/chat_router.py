import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import ChatMessage, ChatSession, User
from schemas import ChatAssistantResponse, ChatMessageCreate, ChatMessageResponse, ChatSessionCreate, ChatSessionResponse
from services.copilot import answer_query

router = APIRouter()


@router.post("/sessions", response_model=ChatSessionResponse)
def create_chat_session(payload: ChatSessionCreate, db: Session = Depends(get_db)):
    user = db.get(User, payload.user_id) if payload.user_id else None
    if user is None:
        user_id = payload.user_id or uuid.uuid4()
        user = User(id=user_id, email=f"demo-{user_id}@local.invalid", password="demo-user-no-login")
        db.add(user)
        db.flush()

    session = ChatSession(user_id=user.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageResponse])
def get_session_messages(session_id: UUID, db: Session = Depends(get_db)):
    if db.get(ChatSession, session_id) is None:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.chat_session_id == session_id)
        .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
        .all()
    )


@router.post("/sessions/{session_id}/messages", response_model=ChatAssistantResponse)
def create_session_message(session_id: UUID, payload: ChatMessageCreate, db: Session = Depends(get_db)):
    if db.get(ChatSession, session_id) is None:
        raise HTTPException(status_code=404, detail="Chat session not found")

    user_message = ChatMessage(chat_session_id=session_id, role="user", content=payload.content)
    db.add(user_message)
    result = answer_query(payload.content, payload.symbol, db)
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
