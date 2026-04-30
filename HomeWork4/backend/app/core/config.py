import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    ENTRA_CLIENT_ID = os.getenv("ENTRA_CLIENT_ID", "")
    ENTRA_TENANT_ID = os.getenv("ENTRA_TENANT_ID", "")
    ENTRA_AUTHORITY = os.getenv("ENTRA_AUTHORITY", "")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
    AZURE_STORAGE_CONTAINER = os.getenv("AZURE_STORAGE_CONTAINER", "profile-pictures")
    AZURE_SERVICE_BUS_CONNECTION_STRING = os.getenv("AZURE_SERVICE_BUS_CONNECTION_STRING", "")
    AZURE_SERVICE_BUS_QUEUE = os.getenv("AZURE_SERVICE_BUS_QUEUE", "booking-events")
    ENTRA_CLIENT_SECRET = os.getenv("ENTRA_CLIENT_SECRET", "")
    ENTRA_BACKEND_CLIENT_ID = os.getenv("ENTRA_BACKEND_CLIENT_ID", "")

settings = Settings()
