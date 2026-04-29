from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel
from app.models.domain import BookingStatus

class BookingCreate(SQLModel):
    contractor_id: int
    scheduled_at: datetime
    notes: Optional[str] = None

class BookingRead(SQLModel):
    id: int
    client_id: int
    contractor_id: int
    status: BookingStatus
    scheduled_at: datetime
    notes: Optional[str] = None
    created_at: datetime
