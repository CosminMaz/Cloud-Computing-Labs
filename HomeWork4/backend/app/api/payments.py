import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime, timezone

from app.core.database import get_session
from app.core.auth import verify_token
from app.core.config import settings
from app.models.domain import User, Booking, ContractorProfile, Payment, PaymentStatus, UserRole, BookingStatus
from app.schemas.payment import PaymentRead, PaymentQuote, PaymentRevise
from app.services.service_bus import ServiceBusPublisher, get_service_bus_publisher

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/quote", response_model=PaymentRead)
def set_quote(
    data: PaymentQuote,
    token_payload: dict = Depends(verify_token),
    session: Session = Depends(get_session),
    publisher: ServiceBusPublisher = Depends(get_service_bus_publisher),
):
    """Contractor sets or updates the price quote for a pending booking."""
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    user = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not user or user.role != UserRole.contractor:
        raise HTTPException(status_code=403, detail="Only contractors can set quotes")
    if data.amount <= 0:
        raise HTTPException(status_code=422, detail="Amount must be greater than 0")

    booking = session.get(Booking, data.booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.contractor_id != user.id:
        raise HTTPException(status_code=403, detail="You can only quote your own bookings")
    if booking.status != BookingStatus.pending:
        raise HTTPException(status_code=409, detail="Can only quote pending bookings")

    payment = session.exec(select(Payment).where(Payment.booking_id == booking.id)).first()
    if payment:
        if payment.status != PaymentStatus.quoted:
            raise HTTPException(status_code=409, detail="Quote can only be updated while awaiting client payment")
        payment.quoted_amount = data.amount
        payment.final_amount = data.amount
    else:
        payment = Payment(
            booking_id=booking.id,
            quoted_amount=data.amount,
            final_amount=data.amount,
            platform_fee_pct=settings.PLATFORM_FEE_PCT,
        )
        session.add(payment)

    session.commit()
    session.refresh(payment)

    client_user = session.get(User, booking.client_id)
    contractor_profile = session.exec(
        select(ContractorProfile).where(ContractorProfile.user_id == user.id)
    ).first()
    event = {
        "event_type": "payment.quoted",
        "bookingId": booking.id,
        "clientEmail": client_user.email if client_user else None,
        "contractorName": (contractor_profile.display_name if contractor_profile else None) or user.display_name or user.email,
        "amount": payment.quoted_amount,
        "date": booking.scheduled_at.isoformat(),
        "serviceType": booking.service_type,
    }
    try:
        publisher.publish(event, subject="payment.quoted")
    except Exception:
        logger.exception("Failed to publish payment.quoted event for booking %s", booking.id)

    return payment


@router.post("/{booking_id}/pay", response_model=PaymentRead)
def pay_booking(
    booking_id: int,
    token_payload: dict = Depends(verify_token),
    session: Session = Depends(get_session),
):
    """Client pays the quoted amount — booking auto-confirms and funds enter escrow."""
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    user = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not user or user.role != UserRole.client:
        raise HTTPException(status_code=403, detail="Only clients can pay bookings")

    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.client_id != user.id:
        raise HTTPException(status_code=403, detail="You can only pay your own bookings")
    if booking.status != BookingStatus.pending:
        raise HTTPException(status_code=409, detail="Booking is not pending payment")

    payment = session.exec(select(Payment).where(Payment.booking_id == booking_id)).first()
    if not payment or payment.status != PaymentStatus.quoted:
        raise HTTPException(status_code=404, detail="No pending quote found for this booking")

    payment.status = PaymentStatus.in_escrow
    payment.paid_at = datetime.now(timezone.utc)
    booking.status = BookingStatus.confirmed

    session.commit()
    session.refresh(payment)
    return payment


@router.patch("/{booking_id}/revise", response_model=PaymentRead)
def revise_quote(
    booking_id: int,
    data: PaymentRevise,
    token_payload: dict = Depends(verify_token),
    session: Session = Depends(get_session),
):
    """Contractor submits a revised price after seeing the actual scope of work."""
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    user = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not user or user.role != UserRole.contractor:
        raise HTTPException(status_code=403, detail="Only contractors can revise quotes")
    if data.new_amount <= 0:
        raise HTTPException(status_code=422, detail="Amount must be greater than 0")

    booking = session.get(Booking, booking_id)
    if not booking or booking.contractor_id != user.id:
        raise HTTPException(status_code=404, detail="Booking not found")

    payment = session.exec(select(Payment).where(Payment.booking_id == booking_id)).first()
    if not payment or payment.status != PaymentStatus.in_escrow:
        raise HTTPException(status_code=409, detail="Can only revise a payment currently in escrow")

    payment.revised_amount = data.new_amount
    payment.status = PaymentStatus.pending_revision

    session.commit()
    session.refresh(payment)
    return payment


@router.post("/{booking_id}/approve-revision", response_model=PaymentRead)
def approve_revision(
    booking_id: int,
    token_payload: dict = Depends(verify_token),
    session: Session = Depends(get_session),
):
    """Client approves a contractor's revised price. final_amount is updated in escrow."""
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    user = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not user or user.role != UserRole.client:
        raise HTTPException(status_code=403, detail="Only clients can approve revisions")

    booking = session.get(Booking, booking_id)
    if not booking or booking.client_id != user.id:
        raise HTTPException(status_code=404, detail="Booking not found")

    payment = session.exec(select(Payment).where(Payment.booking_id == booking_id)).first()
    if not payment or payment.status != PaymentStatus.pending_revision:
        raise HTTPException(status_code=409, detail="No pending revision to approve")

    payment.final_amount = payment.revised_amount
    payment.revised_amount = None
    payment.status = PaymentStatus.in_escrow

    session.commit()
    session.refresh(payment)
    return payment


@router.post("/{booking_id}/release", response_model=PaymentRead)
def release_payment(
    booking_id: int,
    token_payload: dict = Depends(verify_token),
    session: Session = Depends(get_session),
    publisher: ServiceBusPublisher = Depends(get_service_bus_publisher),
):
    """Client confirms completion and releases escrowed funds to the contractor."""
    entra_id = token_payload.get("oid") or token_payload.get("sub")
    user = session.exec(select(User).where(User.entra_id == entra_id)).first()
    if not user or user.role != UserRole.client:
        raise HTTPException(status_code=403, detail="Only clients can release payments")

    booking = session.get(Booking, booking_id)
    if not booking or booking.client_id != user.id:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != BookingStatus.completed:
        raise HTTPException(status_code=409, detail="Booking must be marked complete before releasing payment")

    payment = session.exec(select(Payment).where(Payment.booking_id == booking_id)).first()
    if not payment or payment.status != PaymentStatus.in_escrow:
        raise HTTPException(status_code=409, detail="No escrowed payment to release")

    payment.platform_fee = round(payment.final_amount * payment.platform_fee_pct, 2)
    payment.contractor_payout = round(payment.final_amount - payment.platform_fee, 2)
    payment.status = PaymentStatus.released
    payment.released_at = datetime.now(timezone.utc)

    contractor_profile = session.exec(
        select(ContractorProfile).where(ContractorProfile.user_id == booking.contractor_id)
    ).first()
    if contractor_profile:
        contractor_profile.balance = round((contractor_profile.balance or 0) + payment.contractor_payout, 2)

    session.commit()
    session.refresh(payment)

    contractor_user = session.get(User, booking.contractor_id)
    event = {
        "event_type": "payment.released",
        "bookingId": booking.id,
        "clientEmail": user.email,
        "contractorEmail": contractor_user.email if contractor_user else None,
        "clientName": user.display_name or user.email,
        "contractorName": (contractor_profile.display_name if contractor_profile else None) or (contractor_user.display_name if contractor_user else "Your contractor"),
        "finalAmount": payment.final_amount,
        "platformFee": payment.platform_fee,
        "contractorPayout": payment.contractor_payout,
        "date": booking.scheduled_at.isoformat(),
        "serviceType": booking.service_type,
    }
    try:
        publisher.publish(event, subject="payment.released")
    except Exception:
        logger.exception("Failed to publish payment.released event for booking %s", booking.id)

    return payment
