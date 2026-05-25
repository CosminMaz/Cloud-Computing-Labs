from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel
from app.models.domain import BookingStatus

class BookingCreate(SQLModel):
    contractor_id: int
    scheduled_at: datetime
    service_type: str
    service_address: Optional[str] = None
    client_phone: Optional[str] = None
    notes: Optional[str] = None

class BookingRead(SQLModel):
    id: int
    client_id: int
    contractor_id: int
    status: BookingStatus
    scheduled_at: datetime
    service_type: Optional[str] = None
    service_address: Optional[str] = None
    client_phone: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    contractor_display_name: Optional[str] = None
    contractor_phone: Optional[str] = None
    contractor_contact_email: Optional[str] = None
    contractor_profile_image_url: Optional[str] = None
    contractor_profile_id: Optional[int] = None
    cancelled_by: Optional[str] = None
    client_email: Optional[str] = None
    client_name: Optional[str] = None
