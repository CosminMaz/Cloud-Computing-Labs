import os
from dotenv import load_dotenv
from sqlmodel import create_engine, Session, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print(f"Connecting to: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    with Session(engine) as session:
        result = session.exec(text("SELECT 1")).first()
        print("✅ Success! Connected to Azure SQL Database.")
        print(f"Query Result: {result}")
except Exception as e:
    print("❌ Failed to connect to the database.")
    print(e)
