from uuid import UUID

from fastapi import APIRouter

from schemas import ChatMessageCreate, ChatMessageResponse, ChatSessionCreate, ChatSessionResponse

router = APIRouter()


@router.post("/sessions", response_model=ChatSessionResponse)
def create_chat_session(payload: ChatSessionCreate):
    return {
        "id": "22222222-2222-2222-2222-222222222222",
        "user_id": payload.user_id,
        "created_at": "2026-08-03T00:00:00Z",
    }


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageResponse])
def get_session_messages(session_id: UUID):
    return [
        {
            "id": "33333333-3333-3333-3333-333333333333",
            "chat_session_id": session_id,
            "role": "assistant",
            "content": "This is a placeholder chat response.",
            "created_at": "2026-08-03T00:00:00Z",
        }
    ]


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
def create_session_message(session_id: UUID, payload: ChatMessageCreate):
    return {
        "id": "44444444-4444-4444-4444-444444444444",
        "chat_session_id": session_id,
        "role": payload.role,
        "content": payload.content,
        "created_at": "2026-08-03T00:00:00Z",
    }
