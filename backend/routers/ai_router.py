from fastapi import APIRouter

from schemas import AIQueryRequest, AIQueryResponse

router = APIRouter()


@router.post("/query", response_model=AIQueryResponse)
def query_ai(payload: AIQueryRequest):
    return {
        "answer": f"This is a placeholder AI response for: {payload.query}",
        "status": "ok",
    }
