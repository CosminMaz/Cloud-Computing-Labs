from sqlmodel import SQLModel
from app.models.domain import UserRole

class UserCreate(SQLModel):
    """Frontend only needs to declare which role the new user wants."""
    role: UserRole

class UserRead(SQLModel):
    id: int
    entra_id: str
    email: str
    role: UserRole
