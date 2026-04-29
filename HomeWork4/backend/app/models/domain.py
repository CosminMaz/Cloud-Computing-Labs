from typing import Optional, List
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum

class UserRole(str, Enum):
    client = "client"
    contractor = "contractor"

class BookingStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    entra_id: str = Field(max_length=50, index=True, unique=True, description="Entra Object ID")
    email: str = Field(max_length=255, index=True, unique=True)
    role: UserRole = Field(default=UserRole.client)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    profile: Optional["ContractorProfile"] = Relationship(
        back_populates="user", 
        sa_relationship_kwargs={"uselist": False}
    )
    
    client_bookings: List["Booking"] = Relationship(
        back_populates="client",
        sa_relationship_kwargs={"foreign_keys": "Booking.client_id"}
    )
    contractor_bookings: List["Booking"] = Relationship(
        back_populates="contractor",
        sa_relationship_kwargs={"foreign_keys": "Booking.contractor_id"}
    )

class ContractorProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True)
    
    display_name: str
    skills: Optional[str] = Field(default=None)
    hourly_rate: float = Field(default=0.0)
    bio: Optional[str] = Field(default=None)
    profile_image_url: Optional[str] = Field(default=None)
    
    # Relationship
    user: User = Relationship(back_populates="profile")

class Booking(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    client_id: int = Field(foreign_key="user.id")
    contractor_id: int = Field(foreign_key="user.id")
    
    status: BookingStatus = Field(default=BookingStatus.pending)
    scheduled_at: datetime
    notes: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    client: User = Relationship(
        back_populates="client_bookings",
        sa_relationship_kwargs={"foreign_keys": "[Booking.client_id]"}
    )
    contractor: User = Relationship(
        back_populates="contractor_bookings",
        sa_relationship_kwargs={"foreign_keys": "[Booking.contractor_id]"}
    )
