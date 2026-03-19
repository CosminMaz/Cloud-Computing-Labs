import os

import psycopg2
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="Winamp Recommender Service", version="1.0.0")

DATABASE_URL = os.getenv("DATABASE_URL", "")


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def fetch_melodies_by_genre(genre: str) -> list[str]:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT name FROM melodies WHERE LOWER(genre) = LOWER(%s) ORDER BY RANDOM()",
                (genre,),
            )
            return [row[0] for row in cur.fetchall()]
    finally:
        conn.close()


def fetch_all_melodies() -> list[str]:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT name FROM melodies ORDER BY RANDOM()")
            return [row[0] for row in cur.fetchall()]
    finally:
        conn.close()


def fetch_all_genres() -> list[str]:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT DISTINCT LOWER(genre) FROM melodies WHERE genre != '' ORDER BY 1"
            )
            return [row[0] for row in cur.fetchall()]
    finally:
        conn.close()


class RecommendationRequest(BaseModel):
    favorite_genre: str = Field(default="pop")
    limit: int = Field(default=3, ge=1, le=10)


@app.get("/health")
def health():
    try:
        genres = fetch_all_genres()
        return {"service": "recommender", "status": "ok", "genres": genres}
    except Exception as e:
        return {"service": "recommender", "status": "error", "error": str(e)}


@app.post("/recommendations")
def recommendations(payload: RecommendationRequest):
    genre = payload.favorite_genre.strip().lower()
    tracks = fetch_melodies_by_genre(genre)
    return {
        "genre": genre,
        "recommendations": tracks[: payload.limit],
    }


@app.get("/trending")
def trending(limit: int = 5):
    all_tracks = fetch_all_melodies()
    safe_limit = max(1, min(limit, len(all_tracks))) if all_tracks else 0
    return {
        "trending": all_tracks[:safe_limit],
    }
