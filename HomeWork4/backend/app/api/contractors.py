from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from app.core.database import get_session
from app.core.auth import verify_token
from app.models.domain import User, ContractorProfile, UserRole, Review
from app.schemas.contractor import ContractorProfileRead, ContractorProfileSelf, ContractorProfileUpdate, ContractorProfilePage
from typing import List, Optional

router = APIRouter(prefix="/contractors", tags=["contractors"])


def _attach_stats(profiles, session: Session) -> list:
    """Attach avg_rating and review_count to a list of ContractorProfile ORM objects."""
    if not profiles:
        return []
    contractor_ids = [p.user_id for p in profiles]
    rows = session.exec(
        select(Review.contractor_id, func.avg(Review.rating), func.count(Review.id))
        .where(Review.contractor_id.in_(contractor_ids))
        .group_by(Review.contractor_id)
    ).all()
    stats = {row[0]: (round(float(row[1]), 1), int(row[2])) for row in rows}
    result = []
    for p in profiles:
        read = ContractorProfileRead.model_validate(p)
        avg, count = stats.get(p.user_id, (None, 0))
        read.avg_rating = avg
        read.review_count = count
        result.append(read)
    return result

@router.get("", response_model=ContractorProfilePage)
def list_contractors(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    session: Session = Depends(get_session),
    _token: dict = Depends(verify_token),
):
    """Returns a paginated, searchable list of contractor profiles."""
    query = select(ContractorProfile)
    if search:
        term = f"%{search}%"
        query = query.where(
            ContractorProfile.display_name.ilike(term) |
            ContractorProfile.skills.ilike(term) |
            ContractorProfile.bio.ilike(term) |
            ContractorProfile.location.ilike(term)
        )

    count_query = select(func.count()).select_from(query.subquery())
    total = session.exec(count_query).one()

    items = session.exec(query.order_by(ContractorProfile.id).offset((page - 1) * limit).limit(limit)).all()
    pages = max(1, (total + limit - 1) // limit)

    return ContractorProfilePage(items=_attach_stats(items, session), total=total, page=page, pages=pages)

@router.get("/me", response_model=ContractorProfileSelf)
def get_my_profile(token_payload: dict = Depends(verify_token), session: Session = Depends(get_session)):
    """Returns the logged-in contractor's own profile, including AI prompt."""
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    user = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not user or user.role != UserRole.contractor:
        raise HTTPException(status_code=403, detail="Only contractors can access this")
    profile = session.exec(select(ContractorProfile).where(ContractorProfile.user_id == user.id)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.get("/{contractor_id}", response_model=ContractorProfileRead)
def get_contractor(contractor_id: int, session: Session = Depends(get_session), _token: dict = Depends(verify_token)):
    """Returns a single contractor profile."""
    profile = session.get(ContractorProfile, contractor_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Contractor not found")
    return _attach_stats([profile], session)[0]

@router.put("/me", response_model=ContractorProfileSelf)
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
