import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.auth import verify_token
from app.models.domain import User, Booking, UserRole, BookingStatus
from app.schemas.booking import BookingCreate, BookingRead
from app.services.service_bus import ServiceBusPublisher, get_service_bus_publisher
from typing import List

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bookings", tags=["bookings"])

@router.post("", response_model=BookingRead)
def create_booking(
    data: BookingCreate,
    token_payload: dict = Depends(verify_token),
    session: Session = Depends(get_session),
    publisher: ServiceBusPublisher = Depends(get_service_bus_publisher),
):
    """Creates a new booking and publishes a 'booking.created' event to Service Bus.
    The caller must be a registered Client."""
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    client = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not client or client.role != UserRole.client:
        raise HTTPException(status_code=403, detail="Only clients can create bookings")

    contractor = session.get(User, data.contractor_id)
    if not contractor or contractor.role != UserRole.contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")

    booking = Booking(
        client_id=client.id,
        contractor_id=data.contractor_id,
        scheduled_at=data.scheduled_at,
        notes=data.notes,
    )
    session.add(booking)
    session.commit()
    session.refresh(booking)

    # Fire the async notification. We publish *after* commit so the booking is
    # safe even if Service Bus is unavailable; we log and swallow the publish
    # error so the API contract isn't tied to Service Bus uptime.
    event = {
        "bookingId": booking.id,
        "contractorEmail": contractor.email,
        "clientEmail": client.email,
        "date": booking.scheduled_at.isoformat(),
        "notes": booking.notes,
    }
    try:
        publisher.publish(event, subject="booking.created")
    except Exception:
        logger.exception("Failed to publish booking.created event for booking %s", booking.id)

    return booking

@router.get("/mine", response_model=List[BookingRead])
def get_my_bookings(token_payload: dict = Depends(verify_token), session: Session = Depends(get_session)):
    """Returns all bookings for the logged-in user, whether they are a client or contractor."""
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    user = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not registered")

    if user.role == UserRole.client:
        bookings = session.exec(select(Booking).where(Booking.client_id == user.id)).all()
    else:
        bookings = session.exec(select(Booking).where(Booking.contractor_id == user.id)).all()

    return bookings

from pydantic import BaseModel

class StatusPayload(BaseModel):
    status: str

@router.patch("/{booking_id}/status", response_model=BookingRead)
def update_booking_status(booking_id: int, payload: StatusPayload, token_payload: dict = Depends(verify_token), session: Session = Depends(get_session)):
    """Allows a contractor to confirm or cancel a booking assigned to them."""
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    user = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not registered")

    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.contractor_id != user.id:
        raise HTTPException(status_code=403, detail="You can only update your own bookings")

    try:
        booking.status = BookingStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid status. Must be one of: {[s.value for s in BookingStatus]}")

    session.commit()
    session.refresh(booking)
    return booking
