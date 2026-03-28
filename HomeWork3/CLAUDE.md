# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

DGASPC Social Services Portal ("Portal de Solicitare Ajutor Social — DGASPC Iași") — a Romanian government-inspired platform for submitting and managing social aid requests. Uses 5 GCP services: App Engine, Cloud SQL (PostgreSQL), Cloud Storage, Cloud Pub/Sub, Cloud Functions.

## Current State

The project is being built from a detailed specification. The backend is a scaffolded Spring Boot app at `Backend/Cloud/`. The frontend directory (`Frontend/`) is empty and needs to be initialized.

**Note:** The current backend uses Spring Boot 4.0.5 with Java 21 and package `com.cloud.cloud`. The spec calls for Spring Boot 3 / Java 17 with package `ro.dgaspc.portal` — follow the spec when building out the real implementation, but be aware of the existing scaffold.

## Build & Run Commands

### Backend (Spring Boot + Maven)
```bash
cd Backend/Cloud
./mvnw spring-boot:run          # Run dev server (port 8080)
./mvnw package                  # Build JAR
./mvnw test                     # Run all tests
./mvnw test -Dtest=ClassName    # Run single test class
./mvnw test -Dtest=ClassName#methodName  # Run single test method
```

### Frontend (React — not yet initialized)
```bash
cd Frontend
npm install        # Install dependencies
npm start          # Dev server (port 3000)
npm run build      # Production build
npm test           # Run tests
```

### GCP Deployment
```bash
cd Backend/Cloud && mvn package && gcloud app deploy
gcloud functions deploy notify-citizen --runtime=nodejs18 --trigger-topic=status-updates --region=europe-west1
```

## Architecture

- **Backend:** `Backend/Cloud/` — Spring Boot REST API serving all `/api/*` endpoints. Uses Spring Data JPA for PostgreSQL, Google Cloud Storage SDK for document uploads, Google Cloud Pub/Sub SDK for status change notifications.
- **Frontend:** `Frontend/` — React 18 with plain JS (no TypeScript) and plain CSS (no frameworks). Uses axios to call backend API. All UI text is in Romanian.
- **Cloud Function:** Separate Node.js function (`notify-citizen`) triggered by Pub/Sub topic `status-updates`, sends email notifications to citizens.

### Key Patterns
- Dosar (case) IDs follow format: `CJ-{YEAR}-{4-digit-padded}` e.g. `CJ-2024-0347`
- Document uploads go to GCS bucket `dgaspc-iasi-docs` organized as `{dosar_id}/{filename}`
- Status changes (pending → review → approved/rejected) publish to Pub/Sub topic, logged in `notificari_log` table
- Backend generates signed URLs (15 min expiry) for secure document access
- Frontend has 4 views: home, form (3-step wizard), dashboard, architecture
- CORS must allow both `localhost:3000` and the App Engine domain

### Database Tables
4 PostgreSQL tables: `beneficiari` (citizens), `cereri` (applications), `documente` (uploaded docs with GCS paths), `notificari_log` (Pub/Sub notification audit log). Cloud SQL instance: `dgaspc-db`, database: `dgaspc_portal`.

## Constraints
- No TypeScript, no CSS frameworks (Tailwind, Bootstrap, etc.)
- All UI text in Romanian; code comments/variables in English
- Must use all 5 GCP services (App Engine, Cloud SQL, Cloud Storage, Pub/Sub, Cloud Functions)
- Cloud SQL is the designated **stateful** service
- For local dev: use Cloud SQL Auth Proxy, Pub/Sub emulator (or console logging as fallback)
- Simple auth: hardcoded inspector login (`inspector` / `dgaspc2024`)
