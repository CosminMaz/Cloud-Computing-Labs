# Local Environment Setup Guide

Welcome to the Cloud Computing HW4 team project. The app has three runnable
pieces — follow them in order:

1. **Backend** — FastAPI API (`backend/`)
2. **Frontend** — React + Vite SPA (`frontend/`)
3. **Functions worker** — Python Azure Function that sends booking emails (`functions/booking-email-worker/`)

Ask the team lead for the populated `.env` / `local.settings.json` files. **Never commit secrets.**

---

## 0. Prerequisites

Install these once:

- **Azure CLI** — `az login` with your university Azure Student account.
- **Python 3.11+** — required by both the backend and the function.
- **Node.js 18+** and **npm** — for the React frontend.
- **ODBC Driver 18 for SQL Server** — required by `pyodbc` to talk to Azure SQL.
  - macOS: `brew tap microsoft/mssql-release && brew install msodbcsql18 mssql-tools18`
  - Ubuntu: follow [Microsoft's apt instructions](https://learn.microsoft.com/sql/connect/odbc/linux-mac/installing-the-microsoft-odbc-driver-for-sql-server).
  - Windows: download the MSI from Microsoft.
- **Azure Functions Core Tools v4** — only if you want to run the email worker locally.
  - macOS: `brew tap azure/functions && brew install azure-functions-core-tools@4`
  - Other OSes: see the [Microsoft docs](https://learn.microsoft.com/azure/azure-functions/functions-run-local).

```bash
az login   # browser opens — sign in with your student account
```

---

## 1. Backend (FastAPI)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate                 # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Environment

Copy the template and fill in the values from the team lead:

```bash
cp .env.example .env
```

Variables you'll need (all are documented inline in `.env.example`):

| Variable | Where it comes from |
|---|---|
| `ENTRA_CLIENT_ID`, `ENTRA_TENANT_ID`, `ENTRA_AUTHORITY` | Entra External ID app registration |
| `FRONTEND_URL` | usually `http://localhost:5173` |
| `DATABASE_URL` | Azure SQL connection string (uses ODBC Driver 18) |
| `AZURE_STORAGE_CONNECTION_STRING` | Storage account → Access keys |
| `AZURE_STORAGE_CONTAINER` | default `profile-pictures` |
| `AZURE_SERVICE_BUS_CONNECTION_STRING` | Service Bus namespace → Shared access policies → `RootManageSharedAccessKey` |
| `AZURE_SERVICE_BUS_QUEUE` | default `booking-events` |

### Run

```bash
uvicorn app.main:app --reload
```

Backend is up on <http://localhost:8000>. Swagger UI at `/docs`.

---

## 2. Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Where it comes from |
|---|---|
| `VITE_ENTRA_CLIENT_ID`, `VITE_ENTRA_TENANT_ID`, `VITE_ENTRA_AUTHORITY` | same Entra app registration as the backend |
| `VITE_API_URL` | usually `http://localhost:8000` |
| `VITE_BOT_WEBCHAT_URL` | Azure Bot resource → Channels → Web Chat → embed URL (with Direct Line secret). Leave empty to hide the FAQ chat panel. |

Run:

```bash
npm run dev
```

Frontend is up on <http://localhost:5173>.

> Vite bakes env vars into the bundle at build time. **Restart `npm run dev`** after editing `.env`.

---

## 3. Functions worker (Azure Functions, Python)

The worker listens on Service Bus and sends booking notification emails via Azure
Communication Services. You only need to run it locally if you're working on
the email pipeline — the deployed Function App handles it in the cloud.

```bash
cd functions/booking-email-worker
python3 -m venv .venv
source .venv/bin/activate                 # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp local.settings.json.example local.settings.json
```

Edit `local.settings.json`:

| Setting | Notes |
|---|---|
| `AzureWebJobsStorage` | **Required.** Use the same storage account connection string as the backend (`AZURE_STORAGE_CONNECTION_STRING`) — Functions runtime needs a real Storage account for leases/locks. The default `UseDevelopmentStorage=true` requires Azurite running locally, which is why `func start` complains about an "Unhealthy" storage check if you skip this. |
| `SERVICE_BUS_CONNECTION` | Same Service Bus connection string as the backend. |
| `SERVICE_BUS_QUEUE_NAME` | Must match `AZURE_SERVICE_BUS_QUEUE` (default `booking-events`). |
| `EMAIL_CONNECTION_STRING` | Communication Services resource → Keys → Connection string. |
| `EMAIL_SENDER_ADDRESS` | `DoNotReply@<your-azure-managed-domain>.azurecomm.net` from Email Communication Services. |

Run:

```bash
func start
```

You should see `on_booking_created: serviceBusTrigger` in the function list and
no "Unhealthy" warnings. When the backend publishes a `booking.created` event,
this terminal logs `Received booking event: {...}` followed by `Sent booking
email to ...`.

---

## 4. End-to-end smoke test

Once the three pieces are up:

1. Open <http://localhost:5173> and sign in.
2. As a **contractor**: fill in profile, upload a profile picture (verifies Blob).
3. As a **client**: open a contractor's profile (verifies Blob read), use the
   FAQ chat panel (verifies Bot Service), and submit a booking.
4. Check your **`func start`** terminal — you should see the message arrive
   within ~2 seconds and an ACS 202 response.
5. Check the contractor's email inbox — the notification should land within a
   minute. (If the contractor's `email` is the `@no-email.ciam` placeholder,
   the booking pipeline still completes but ACS will fail to deliver. Update
   the row in SQL or fix the Entra user-flow claim — see the Phase 4 notes.)

---

## 5. Common gotchas

- **`pyodbc` install fails** — install ODBC Driver 18 *first*, then `pip install`.
- **`401 Invalid token`** — the frontend and backend are configured for *different* Entra tenants. Compare `ENTRA_CLIENT_ID` on both sides.
- **`AZURE_SERVICE_BUS_CONNECTION_STRING is not configured`** — backend `.env` is missing the variable; restart uvicorn after adding it.
- **Function "Unhealthy" on storage** — fix `AzureWebJobsStorage` in `local.settings.json` (see §3).
- **Blob URL returns 409 PublicAccessNotPermitted** — Storage account → Configuration → enable "Allow Blob anonymous access", then container access level → "Blob".
- **Email never arrives** — verify the contractor's `email` in SQL is a real address, and that the recipient is reachable from your ACS managed domain (free tier has external-recipient restrictions).

---

## 6. Files you should never commit

The repo `.gitignore` already covers them, but be aware:

- `backend/.env`
- `frontend/.env`
- `functions/booking-email-worker/local.settings.json`

There are `.example` files next to each so teammates can see the shape of the config without seeing secrets.
