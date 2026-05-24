import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.auth import verify_token
from app.core.graph import get_user_email_from_graph
from app.models.domain import User
from app.schemas.user import UserCreate, UserRead

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/me", response_model=UserRead)
def upsert_me(payload: UserCreate, token_payload: dict = Depends(verify_token), session: Session = Depends(get_session)):
    """
    Called once after login. Extracts identity from the verified JWT — never trusts
    the frontend to supply entra_id or email.
    - If the user already exists in DB: return their record.
    - If brand new: create them with the role the frontend chose.
    """
    # Extract identity from the cryptographically-verified token
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    email = (
        token_payload.get("email") or
        token_payload.get("preferred_username") or
        token_payload.get("upn") or
        # JWT doesn't carry email in CIAM — fetch it from Graph API instead
        get_user_email_from_graph(entra_id) or
        # Final fallback if Graph also fails (missing secret, network error, etc.)
        f"{entra_id}@no-email.ciam"
    )
    display_name = token_payload.get("name") or token_payload.get("given_name")

    existing = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if existing:
        if display_name and existing.display_name != display_name:
            existing.display_name = display_name
            session.commit()
            session.refresh(existing)
        return existing

    new_user = User(entra_id=entra_id, email=email, display_name=display_name, role=payload.role)
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
    display_name = token_payload.get("name") or token_payload.get("given_name")
    if display_name and user.display_name != display_name:
        user.display_name = display_name
        session.commit()
        session.refresh(user)
    return user
