from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from app.core.database import get_session
from app.core.auth import verify_token
from app.models.domain import User, Review, Booking, UserRole, BookingStatus
from app.schemas.review import ReviewCreate, ReviewRead, ReviewStats, ReviewUpdate

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=ReviewRead)
def submit_review(
    data: ReviewCreate,
    token_payload: dict = Depends(verify_token),
    session: Session = Depends(get_session),
):
    """Client submits a review. Requires at least one completed booking with the contractor."""
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    client = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not client or client.role != UserRole.client:
        raise HTTPException(status_code=403, detail="Only clients can submit reviews")

    if not 1 <= data.rating <= 5:
        raise HTTPException(status_code=422, detail="Rating must be between 1 and 5")

    completed = session.exec(
        select(Booking).where(
            Booking.client_id == client.id,
            Booking.contractor_id == data.contractor_id,
            Booking.status == BookingStatus.completed,
        )
    ).first()
    if not completed:
        raise HTTPException(status_code=403, detail="You can only review contractors you have completed a booking with")

    existing = session.exec(
        select(Review).where(
            Review.client_id == client.id,
            Review.contractor_id == data.contractor_id,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="You have already reviewed this contractor")

    review = Review(
        contractor_id=data.contractor_id,
        client_id=client.id,
        rating=data.rating,
        comment=data.comment,
        client_name=client.display_name or client.email,
    )
    session.add(review)
    session.commit()
    session.refresh(review)
    return review


@router.get("/contractor/{contractor_id}", response_model=ReviewStats)
def get_contractor_reviews(
    contractor_id: int,
    session: Session = Depends(get_session),
    _token: dict = Depends(verify_token),
):
    """Returns all reviews and aggregate stats for a contractor (by User.id)."""
    reviews = session.exec(
        select(Review).where(Review.contractor_id == contractor_id).order_by(Review.created_at.desc())
    ).all()

    if not reviews:
        return ReviewStats(avg_rating=0.0, review_count=0, distribution={1:0,2:0,3:0,4:0,5:0}, reviews=[])

    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in reviews:
        distribution[r.rating] = distribution.get(r.rating, 0) + 1

    avg = round(sum(r.rating for r in reviews) / len(reviews), 1)

    return ReviewStats(
        avg_rating=avg,
        review_count=len(reviews),
        distribution=distribution,
        reviews=reviews,
    )


@router.patch("/{review_id}", response_model=ReviewRead)
def update_review(
    review_id: int,
    data: ReviewUpdate,
    token_payload: dict = Depends(verify_token),
    session: Session = Depends(get_session),
):
    """Client updates their own existing review."""
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    client = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not client or client.role != UserRole.client:
        raise HTTPException(status_code=403, detail="Only clients can edit reviews")

    if not 1 <= data.rating <= 5:
        raise HTTPException(status_code=422, detail="Rating must be between 1 and 5")

    review = session.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.client_id != client.id:
        raise HTTPException(status_code=403, detail="You can only edit your own reviews")

    review.rating = data.rating
    review.comment = data.comment
    session.commit()
    session.refresh(review)
    return review


@router.get("/my-review/{contractor_id}", response_model=ReviewRead)
def get_my_review(
    contractor_id: int,
    token_payload: dict = Depends(verify_token),
    session: Session = Depends(get_session),
):
    """Returns the current client's existing review for a contractor, if any."""
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    client = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not client:
        raise HTTPException(status_code=404, detail="User not registered")

    review = session.exec(
        select(Review).where(
            Review.client_id == client.id,
            Review.contractor_id == contractor_id,
        )
    ).first()
    if not review:
        raise HTTPException(status_code=404, detail="No review found")
    return review
