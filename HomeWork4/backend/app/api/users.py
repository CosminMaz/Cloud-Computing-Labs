from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.auth import verify_token
from app.models.domain import User
from app.schemas.user import UserCreate, UserRead
from app.services.graph import fetch_user_email

router = APIRouter(prefix="/users", tags=["users"])


def _resolve_email(token_payload: dict) -> tuple[str, bool]:
    """
    Returns (email, is_real) where is_real=False means it's the oid placeholder.
    Order of preference: token claims → Graph API → placeholder.
    """
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    email_from_token = (
        token_payload.get("email") or
        token_payload.get("preferred_username") or
        token_payload.get("upn")
    )
    if email_from_token:
        return email_from_token, True

    # CIAM doesn't expose email in token claims — fetch from Graph API instead.
    email_from_graph = fetch_user_email(entra_id)
    if email_from_graph:
        return email_from_graph, True

    return f"{entra_id}@no-email.ciam", False


@router.post("/me", response_model=UserRead)
def upsert_me(payload: UserCreate, token_payload: dict = Depends(verify_token), session: Session = Depends(get_session)):
    """
    Called once after login. Extracts identity from the verified JWT — never trusts
    the frontend to supply entra_id or email.
    - If the user already exists in DB: return their record (updating email if it was a placeholder).
    - If brand new: create them with the role the frontend chose.
    """
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    email, is_real = _resolve_email(token_payload)

    existing = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if existing:
        # Upgrade placeholder email to the real one if we now have it.
        if is_real and existing.email.endswith("@no-email.ciam"):
            existing.email = email
            session.add(existing)
            session.commit()
            session.refresh(existing)
        return existing

    new_user = User(entra_id=entra_id, email=email, role=payload.role)
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user


@router.get("/me", response_model=UserRead)
def get_me(token_payload: dict = Depends(verify_token), session: Session = Depends(get_session)):
    """
    Returns the DB record for the currently logged-in user.
    Returns 404 if the user has never registered (no role yet).
    The frontend uses this to decide whether to show the role-selection page.
    """
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    user = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not registered yet")
    return user
