from typing import Optional, Dict
from datetime import datetime
from sqlmodel import SQLModel


class ReviewCreate(SQLModel):
    contractor_id: int
    rating: int
    comment: Optional[str] = None


class ReviewRead(SQLModel):
    id: int
    contractor_id: int
    client_id: int
    client_name: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    created_at: datetime


class ReviewStats(SQLModel):
    avg_rating: float
    review_count: int
    distribution: Dict[int, int]
    reviews: list[ReviewRead]
