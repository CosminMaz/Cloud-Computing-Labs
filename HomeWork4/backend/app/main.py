from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .core.auth import verify_token

from .core.config import settings

app = FastAPI(title="Cloud CRM Backend")

# Setup CORS to allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "FastAPI Backend is running!"}

@app.get("/api/me")
def get_current_user(token_payload: dict = Depends(verify_token)):
    """
    This route is protected by the verify_token dependency.
    If the code reaches here, the token is 100% mathematically verified!
    """
    return {
        "message": "Authentication successful! Your backend has securely verified your Microsoft token.",
        "user_id": token_payload.get("oid"),
        "raw_token_data": token_payload
    }
