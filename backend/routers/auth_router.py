from fastapi import APIRouter

from schemas import AuthToken, UserCreate, UserResponse

router = APIRouter()


@router.post("/register", response_model=UserResponse)
def register_user(payload: UserCreate):
    return {
        "id": "11111111-1111-1111-1111-111111111111",
        "email": payload.email,
        "created_at": "2026-08-03T00:00:00Z",
    }


@router.post("/login", response_model=AuthToken)
def login_user(payload: UserCreate):
    return {
        "access_token": "placeholder-token",
        "token_type": "bearer",
    }
