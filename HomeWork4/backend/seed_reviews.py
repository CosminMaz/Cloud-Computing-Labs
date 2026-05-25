"""
Quick dev-only script to seed dummy reviews.
Run from the backend/ directory:
    python seed_reviews.py
"""
import random
from datetime import datetime, timezone, timedelta
from sqlmodel import Session, select
from app.core.database import engine
from app.models.domain import User, UserRole, ContractorProfile, Review

FAKE_REVIEWERS = [
    ("Maria Popescu",     "seed_maria@fake.dev"),
    ("Andrei Ionescu",    "seed_andrei@fake.dev"),
    ("Elena Constantin",  "seed_elena@fake.dev"),
    ("Mihai Dumitrescu",  "seed_mihai@fake.dev"),
    ("Ana Popa",          "seed_ana@fake.dev"),
    ("George Stancu",     "seed_george@fake.dev"),
    ("Ioana Marin",       "seed_ioana@fake.dev"),
    ("Vlad Georgescu",    "seed_vlad@fake.dev"),
]

COMMENTS = [
    "Really professional, would hire again!",
    "Good work but arrived a bit late.",
    "Excellent service, fixed everything quickly.",
    "Did the job well, fair price.",
    "Very knowledgeable and polite.",
    "Not great communication but the result was fine.",
    "Outstanding! Above and beyond.",
    "Solid work, no complaints.",
    "Would recommend to others.",
    None,
    None,
]

with Session(engine) as session:
    contractors = session.exec(select(ContractorProfile)).all()
    if not contractors:
        print("No contractors found. Create a contractor profile first.")
        exit(1)

    # Upsert fake client users
    fake_users = []
    for name, email in FAKE_REVIEWERS:
        user = session.exec(select(User).where(User.email == email)).first()
        if not user:
            user = User(
                entra_id=f"seed-{email}",
                email=email,
                display_name=name,
                role=UserRole.client,
            )
            session.add(user)
            session.flush()  # get the ID immediately
        fake_users.append(user)

    added = 0
    for contractor in contractors:
        for user in fake_users:
            existing = session.exec(
                select(Review).where(
                    Review.contractor_id == contractor.user_id,
                    Review.client_id == user.id,
                )
            ).first()
            if existing:
                continue

            review = Review(
                contractor_id=contractor.user_id,
                client_id=user.id,
                rating=random.randint(1, 5),
                comment=random.choice(COMMENTS),
                client_name=user.display_name,
                created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 90)),
            )
            session.add(review)
            added += 1

    session.commit()
    print(f"Done — added {added} dummy review(s).")
