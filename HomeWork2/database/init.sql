-- Winamp users table
CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(64)  NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    display_name  VARCHAR(128) NOT NULL DEFAULT '',
    favorite_genre VARCHAR(64) NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Winamp melodies table
CREATE TABLE IF NOT EXISTS melodies (
    name    VARCHAR(256) NOT NULL UNIQUE,
    genre   VARCHAR(64)  NOT NULL DEFAULT '',
    album   VARCHAR(256) NOT NULL DEFAULT '',
    artist  VARCHAR(256) NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_melodies_name  ON melodies(name);
CREATE INDEX IF NOT EXISTS idx_melodies_genre ON melodies(genre);
