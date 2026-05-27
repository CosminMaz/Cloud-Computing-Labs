from sqlmodel import SQLModel, create_engine, Session
from typing import Generator
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=True, # Logs all SQL queries
    pool_pre_ping=True
)

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

def init_db():
    # Import domain here so metadata is populated before create_all
    from app.models import domain
    SQLModel.metadata.create_all(engine)
