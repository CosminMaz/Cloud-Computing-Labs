from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.auth import verify_token
from app.models.domain import User, ContractorProfile, UserRole
from app.schemas.contractor import ContractorProfileRead, ContractorProfileUpdate
from typing import List

router = APIRouter(prefix="/contractors", tags=["contractors"])

@router.get("", response_model=List[ContractorProfileRead])
def list_contractors(session: Session = Depends(get_session), _token: dict = Depends(verify_token)):
    """Returns all contractor profiles for the client search page."""
    return session.exec(select(ContractorProfile)).all()

@router.get("/{contractor_id}", response_model=ContractorProfileRead)
def get_contractor(contractor_id: int, session: Session = Depends(get_session), _token: dict = Depends(verify_token)):
    """Returns a single contractor profile."""
    profile = session.get(ContractorProfile, contractor_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Contractor not found")
    return profile

@router.put("/me", response_model=ContractorProfileRead)
def update_my_profile(data: ContractorProfileUpdate, token_payload: dict = Depends(verify_token), session: Session = Depends(get_session)):
    """
    Allows a logged-in contractor to create or update their profile.
    If the contractor has no profile yet, it creates one.
    """
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    user = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not user or user.role != UserRole.contractor:
        raise HTTPException(status_code=403, detail="Only contractors can update a profile")

    profile = session.exec(select(ContractorProfile).where(ContractorProfile.user_id == user.id)).first()

    if not profile:
        # Create a new profile
        profile = ContractorProfile(
            user_id=user.id,
            display_name=data.display_name or user.email,
            skills=data.skills,
            hourly_rate=data.hourly_rate or 0.0,
            bio=data.bio,
            profile_image_url=data.profile_image_url,
        )
        session.add(profile)
    else:
        # Update existing profile fields
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(profile, key, value)

    session.commit()
    session.refresh(profile)
    return profile
