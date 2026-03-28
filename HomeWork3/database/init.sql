-- ===========================================
-- DGASPC Portal — Database Initialization
-- Database: dgaspc_portal (Cloud SQL PostgreSQL 14)
-- Instance: dgaspc-db
-- ===========================================

CREATE TABLE IF NOT EXISTS beneficiari (
    id SERIAL PRIMARY KEY,
    nume VARCHAR(100) NOT NULL,
    cnp VARCHAR(13) UNIQUE NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefon VARCHAR(20),
    adresa TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cereri (
    id SERIAL PRIMARY KEY,
    dosar_id VARCHAR(20) UNIQUE NOT NULL,
    beneficiar_id INTEGER REFERENCES beneficiari(id),
    tip_ajutor VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    detalii TEXT,
    judet VARCHAR(50) DEFAULT 'Iași',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documente (
    id SERIAL PRIMARY KEY,
    cerere_id INTEGER REFERENCES cereri(id),
    nume_fisier VARCHAR(200),
    gcs_path TEXT,
    tip_document VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notificari_log (
    id SERIAL PRIMARY KEY,
    cerere_id INTEGER REFERENCES cereri(id),
    tip_eveniment VARCHAR(50),
    status_vechi VARCHAR(20),
    status_nou VARCHAR(20),
    pubsub_message_id VARCHAR(100),
    trimis_la TIMESTAMP DEFAULT NOW()
);
