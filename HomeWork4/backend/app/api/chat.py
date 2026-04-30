from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.core.auth import verify_token
from app.services.qna import QnAService, get_qna_service

router = APIRouter(prefix="/chat", tags=["chat"])


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)


class AskResponse(BaseModel):
    answer: str
    confidence: float


@router.post("/ask", response_model=AskResponse)
def ask(
    payload: AskRequest,
    _token: dict = Depends(verify_token),
    qna: QnAService = Depends(get_qna_service),
):
    """Forwards the user's question to the deployed Custom Question Answering
    knowledge base and returns the top answer."""
    try:
        result = qna.ask(payload.question)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    return AskResponse(**result)
