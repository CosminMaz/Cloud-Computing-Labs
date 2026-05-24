from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session
from typing import List
from app.core.auth import verify_token
from app.core.database import get_session
from app.models.domain import ContractorProfile
from app.services.gemini_service import ask_gemini, build_system_prompt

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str
    text: str


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    contractor_id: int
    history: List[ChatMessage] = []


class AskResponse(BaseModel):
    answer: str


@router.post("/ask", response_model=AskResponse)
def ask(
    payload: AskRequest,
    _token: dict = Depends(verify_token),
    session: Session = Depends(get_session),
):
    """Fetches the contractor, builds a context-aware system prompt, and
    forwards the conversation to Gemini."""
    contractor = session.get(ContractorProfile, payload.contractor_id)
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")

    system_prompt = build_system_prompt(contractor)
    history = [{"role": m.role, "parts": [m.text]} for m in payload.history]

    try:
        answer = ask_gemini(payload.question, system_prompt, history)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    return AskResponse(answer=answer)
