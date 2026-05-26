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
    phone: Optional[str] = None
    contact_email: Optional[str] = None
    location: Optional[str] = None
    years_experience: Optional[int] = 0
    website: Optional[str] = None
    avg_rating: Optional[float] = None
    review_count: int = 0

class ContractorProfileSelf(ContractorProfileRead):
    ai_custom_prompt: Optional[str] = None
    balance: float = 0.0

class ContractorProfilePage(SQLModel):
    items: list[ContractorProfileRead]
    total: int
    page: int
    pages: int

class ContractorProfileUpdate(SQLModel):
    display_name: Optional[str] = None
    skills: Optional[str] = None
    hourly_rate: Optional[float] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    ai_custom_prompt: Optional[str] = None
    phone: Optional[str] = None
    contact_email: Optional[str] = None
    location: Optional[str] = None
    years_experience: Optional[int] = None
    website: Optional[str] = None
