import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.auth import verify_token
from app.models.domain import User, Booking, ContractorProfile, UserRole, BookingStatus, Payment, PaymentStatus
from app.schemas.booking import BookingCreate, BookingRead
from app.schemas.payment import PaymentRead
from app.services.service_bus import ServiceBusPublisher, get_service_bus_publisher
from typing import List

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bookings", tags=["bookings"])


def _attach_payments(entries: list[BookingRead], session: Session) -> None:
    """Mutates BookingRead entries in-place, attaching their Payment if one exists."""
    ids = [e.id for e in entries]
    if not ids:
        return
    payments = session.exec(select(Payment).where(Payment.booking_id.in_(ids))).all()
    pay_map = {p.booking_id: p for p in payments}
    for entry in entries:
        p = pay_map.get(entry.id)
        if p:
            entry.payment = PaymentRead.model_validate(p)

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
        service_type=data.service_type,
        service_address=data.service_address,
        client_phone=data.client_phone,
        notes=data.notes,
    )
    session.add(booking)
    session.commit()
    session.refresh(booking)

    # Fire the async notification. We publish *after* commit so the booking is
    # safe even if Service Bus is unavailable; we log and swallow the publish
    # error so the API contract isn't tied to Service Bus uptime.
    event = {
        "event_type": "booking.created",
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
        result = []
        for b in bookings:
            contractor_user = session.get(User, b.contractor_id)
            contractor_profile = session.exec(
                select(ContractorProfile).where(ContractorProfile.user_id == b.contractor_id)
            ).first() if contractor_user else None
            entry = BookingRead.model_validate(b)
            if contractor_profile:
                entry.contractor_display_name = contractor_profile.display_name
                entry.contractor_phone = contractor_profile.phone
                entry.contractor_contact_email = contractor_profile.contact_email
                entry.contractor_profile_image_url = contractor_profile.profile_image_url
                entry.contractor_profile_id = contractor_profile.id
            elif contractor_user:
                entry.contractor_display_name = contractor_user.email
            result.append(entry)
        _attach_payments(result, session)
        return result
    else:
        bookings = session.exec(select(Booking).where(Booking.contractor_id == user.id)).all()
        result = []
        for b in bookings:
            client_user = session.get(User, b.client_id)
            entry = BookingRead.model_validate(b)
            if client_user:
                entry.client_email = client_user.email
                entry.client_name = client_user.display_name
            result.append(entry)
        _attach_payments(result, session)
        return result

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class StatusPayload(BaseModel):
    status: str

class ReschedulePayload(BaseModel):
    scheduled_at: datetime

class NotesPayload(BaseModel):
    contractor_notes: Optional[str]

@router.get("/completed-with/{contractor_id}")
def has_completed_booking_with(contractor_id: int, token_payload: dict = Depends(verify_token), session: Session = Depends(get_session)):
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    client = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not client:
        raise HTTPException(status_code=404, detail="User not registered")
    match = session.exec(
        select(Booking).where(
            Booking.client_id == client.id,
            Booking.contractor_id == contractor_id,
            Booking.status == BookingStatus.completed,
        )
    ).first()
    return {"has_completed": match is not None}


@router.patch("/{booking_id}/notes", response_model=BookingRead)
def update_contractor_notes(booking_id: int, payload: NotesPayload, token_payload: dict = Depends(verify_token), session: Session = Depends(get_session)):
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    user = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not user or user.role != UserRole.contractor:
        raise HTTPException(status_code=403, detail="Only contractors can edit booking notes")
    booking = session.get(Booking, booking_id)
    if not booking or booking.contractor_id != user.id:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.contractor_notes = payload.contractor_notes
    session.commit()
    session.refresh(booking)
    return booking


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

    if user.role == UserRole.client:
        if booking.client_id != user.id:
            raise HTTPException(status_code=403, detail="You can only update your own bookings")
        if payload.status != BookingStatus.cancelled.value:
            raise HTTPException(status_code=403, detail="Clients may only cancel bookings")
        if booking.status != BookingStatus.pending:
            raise HTTPException(status_code=409, detail="Only pending bookings can be cancelled")
    else:
        if booking.contractor_id != user.id:
            raise HTTPException(status_code=403, detail="You can only update your own bookings")
        if payload.status == BookingStatus.confirmed.value:
            raise HTTPException(status_code=403, detail="Bookings are confirmed via the payment flow")

    try:
        booking.status = BookingStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid status. Must be one of: {[s.value for s in BookingStatus]}")

    if booking.status == BookingStatus.cancelled:
        booking.cancelled_by = user.role.value
        payment = session.exec(select(Payment).where(Payment.booking_id == booking.id)).first()
        if payment and payment.status in (PaymentStatus.quoted, PaymentStatus.in_escrow, PaymentStatus.pending_revision):
            payment.status = PaymentStatus.refunded

    session.commit()
    session.refresh(booking)
    return booking

@router.patch("/{booking_id}/reschedule", response_model=BookingRead)
def reschedule_booking(booking_id: int, payload: ReschedulePayload, token_payload: dict = Depends(verify_token), session: Session = Depends(get_session), publisher: ServiceBusPublisher = Depends(get_service_bus_publisher)):
    """Allows a contractor to change the scheduled time of a pending or confirmed booking."""
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    user = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not user or user.role != UserRole.contractor:
        raise HTTPException(status_code=403, detail="Only contractors can reschedule bookings")

    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.contractor_id != user.id:
        raise HTTPException(status_code=403, detail="You can only reschedule your own bookings")
    if booking.status not in (BookingStatus.pending, BookingStatus.confirmed):
        raise HTTPException(status_code=409, detail="Only pending or confirmed bookings can be rescheduled")

    booking.scheduled_at = payload.scheduled_at
    session.commit()
    session.refresh(booking)

    client_user = session.get(User, booking.client_id)
    entry = BookingRead.model_validate(booking)
    if client_user:
        entry.client_email = client_user.email
        entry.client_name = client_user.display_name

    contractor_profile = session.exec(
        select(ContractorProfile).where(ContractorProfile.user_id == user.id)
    ).first()
    event = {
        "event_type": "booking.rescheduled",
        "bookingId": booking.id,
        "clientEmail": client_user.email if client_user else None,
        "contractorName": (contractor_profile.display_name if contractor_profile else None) or user.display_name or user.email,
        "newDate": booking.scheduled_at.isoformat(),
        "serviceType": booking.service_type,
    }
    try:
        publisher.publish(event, subject="booking.rescheduled")
    except Exception:
        logger.exception("Failed to publish booking.rescheduled event for booking %s", booking.id)

    return entry
