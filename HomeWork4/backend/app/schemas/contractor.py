from typing import Optional
from sqlmodel import SQLModel

class ContractorProfileRead(SQLModel):
    id: int
    user_id: int
    display_name: str
    skills: Optional[str] = None
    hourly_rate: float
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None

class ContractorProfileUpdate(SQLModel):
    display_name: Optional[str] = None
    skills: Optional[str] = None
    hourly_rate: Optional[float] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
