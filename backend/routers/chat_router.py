from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import ChatMessage, ChatSession, User
from schemas import ChatAssistantResponse, ChatMessageCreate, ChatMessageResponse, ChatSessionCreate, ChatSessionResponse
from services.copilot import answer_query
from services.auth import get_current_user

router = APIRouter()


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
