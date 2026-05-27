from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel
from app.models.domain import PaymentStatus


class PaymentRead(SQLModel):
    id: int
    booking_id: int
    quoted_amount: float
    final_amount: float
    revised_amount: Optional[float] = None
    platform_fee_pct: float
    platform_fee: Optional[float] = None
    contractor_payout: Optional[float] = None
    status: PaymentStatus
    created_at: datetime
    paid_at: Optional[datetime] = None
    released_at: Optional[datetime] = None


class PaymentQuote(SQLModel):
    booking_id: int
    amount: float


class PaymentRevise(SQLModel):
    new_amount: float
