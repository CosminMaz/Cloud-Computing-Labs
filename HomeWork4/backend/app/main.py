from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import init_db
from app.core.config import settings
from app.api import users, contractors, bookings, uploads, chat, reviews, messages

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Reparo Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api")
app.include_router(contractors.router, prefix="/api")
app.include_router(bookings.router, prefix="/api")
app.include_router(uploads.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(messages.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "FastAPI Backend is running!"}

