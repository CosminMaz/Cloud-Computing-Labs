# Cloud Application Architecture & Use Case Plan (Homework 4)

This plan details the code architecture, system orchestration, use cases, and workload distribution for your Light CRM / Marketplace application, using the **React + FastAPI + SQLModel** stack alongside the 9 Azure Cloud Services.

---

## 1. Handling the Frontends

You actually have two distinct user perspectives (Client and Contractor). To handle this gracefully, you will use a **Unified Single-Page Application (SPA)**. 

You build *one* React app. When a user logs in via Microsoft Entra External ID, their token contains their "Role" (Client or Contractor). Depending on the role, the React Router dynamically sends them to entirely different dashboard layouts (e.g., `yourapp.com/portal/client` vs `yourapp.com/portal/contractor`).
*   *Advantage:* You easily share UI components (buttons, navbars, forms), heavily reduce duplicate code, and only have to deploy to a single Azure Static Web App.

---

## 2. Code Modularity Architecture

To keep the codebase comprehensible and avoid merge conflicts among 4 people, adhere to this strict folder structure.

### Frontend Architecture (React)
A clean, feature-driven structure:
```text
src/
├── components/      # Reusable UI only (Buttons, Modals, Cards). No business logic here.
├── pages/           # High-level views
│   ├── client/      # (e.g., SearchPage.jsx, ContractorProfile.jsx)
│   └── contractor/  # (e.g., Dashboard.jsx, EditProfile.jsx)
├── services/        # Axios files communicating with FastAPI (e.g., apiContractors.js, apiBookings.js)
├── contexts/        # React Context (Auth state, Theme state)
└── assets/          # Static files, images, global CSS
```

### Backend Architecture (FastAPI + SQLModel)
A standard, highly scalable micro-framework structure:
```text
app/
├── main.py          # App entry point, CORS setup, registers routers
├── api/             # API routing ("controllers")
│   ├── routes_client.py 
│   └── routes_contractor.py
├── models/          # SQLModel classes (acting as both DB Tables and base data shapes)
│   ├── users.py     # Contractor/Client models
│   └── bookings.py  # Appointment models
├── schemas/         # Pydantic classes for specialized In/Out requests (e.g., UserCreateRequest)
├── services/        # Business logic & external Azure Cloud connections
│   ├── blob_service.py # Uploads images to Azure Blob
│   ├── bus_service.py  # Pushes messages to Azure Service Bus
│   └── db.py           # Database connection engines
└── core/            # Configuration, secrets loading, JWT validation
```

---

## 3. Application Elements & Detailed Use Cases

A breakdown of the MVP use-cases required to successfully demonstrate the architecture for Homework 4.

### Client Perspective
1.  **Register / Identity:** Create an account via Microsoft Entra External ID (assigns "Client" role).
2.  **Marketplace Home:** View a grid of available Contractors.
3.  **Search & Filter:** Send a query to FastAPI to filter Contractors by category (e.g., "Plumbing").
4.  **View Profile:** Click on a Contractor to see their profile details, contact information (email/phone), and Blob Storage profile picture.
5.  **Bot Triage:** Interact with the Azure AI QnA Bot on the profile page to ask FAQs before booking.
6.  **Create Booking:** Submit a form requesting a specific date. 
    *   *Orchestration:* Frontend -> FastAPI. FastAPI saves to Azure SQL and drops a "Booking Created" message onto the Azure Service Bus.

### Contractor Perspective
1.  **Register / Identity:** Create an account via Microsoft Entra External ID (assigns "Contractor" role).
2.  **Profile Management:** Set their display name, contact details (email/phone), working category, and upload a profile picture (which FastAPI forwards to Azure Blob Storage).
3.  **FAQ Upload:** Upload a simple list of FAQs to feed their specific QnA Bot.
4.  **Dashboard:** Query FastAPI to view a table of incoming booking requests.
5.  **Email Notifications (Background):** When a client books them, the Azure Service Bus triggers an Azure Function. The Azure Function securely uses SendGrid to email the contractor a notification.
6.  **Invoice Generation (Bonus):** As an expansion task, the contractor can click a button on the dashboard to automatically generate and send an invoice email to the client via SendGrid.

---

## 4. Workload Division (4 Members)

To maximize efficiency and minimize overlap, divide the team functionally across the Full-Stack application.

### Member 1: Frontend Client Specialist
*   **Responsibilities:** React Router setup, building the Unified SPA shell, creating shared UI Components (cards, inputs).
*   **Tasks:** Develop the "Marketplace" search page, and the Contractor display view. Write the generic API connection service (`axios` setup) to talk to FastAPI.

### Member 2: Frontend Contractor & Bot Integrator
*   **Responsibilities:** Integrating Microsoft Entra External ID auth into the React app (handling tokens). 
*   **Tasks:** Develop the "Contractor Dashboard" and "Edit Profile" pages. Integrate the Azure AI Bot Web Chat widget into the application so the client can talk to it.

### Member 3: Backend Core & Database Administrator (FastAPI + SQL)
*   **Responsibilities:** Provisioning Azure SQL DB. Defining the `SQLModel` schemas for Users and Bookings.
*   **Tasks:** Setting up the FastAPI `main.py`, building the generic CRUD routes (Create Booking, Get Contractors). Writing the backend Middleware to validate the Entra JWT token.

### Member 4: Cloud Services & Orchestration (Backend)
*   **Responsibilities:** This involves the most "Cloud Computing" orchestration. 
*   **Tasks:** 
    1. Write FastAPI service to stream image uploads to **Azure Blob Storage**.
    2. Provision **Azure Service Bus** and write FastAPI code to push events.
    3. Write the **Azure Function** (in Python) that listens to the Service Bus and uses **SendGrid** to dispatch emails.

---

> [!IMPORTANT]
> **User Review Requested**
> Please review the architecture, modular codebase structure, and the work decomposition for your team. Does this division of labor look fair and understandable to everyone, or do you need me to adjust the responsibilities?

---

## 5. Pending Feature Roadmap (Post-MVP)

Ordered by dependency and priority. Each tier should be completed before moving to the next.

---

### Tier 1 — Foundation (Navigation & Role Completeness) ✅ COMPLETE

These fix fundamental gaps in the current experience. Other features depend on them being in place.

1. ✅ **Separate contractor profile page** (`/contractor/profile`)
   - Move the "Edit Your Profile" card out of the dashboard into its own route.
   - Add view/edit toggle: read mode shows the profile nicely; "Edit" button switches to the form with Save/Cancel.
   - Dashboard becomes bookings-only CRM.

2. ✅ **Client bookings page** (`/client/bookings`) + Navbar links
   - New page showing all bookings the client has made, with status badges, contractor name, date, and notes.
   - Cancel button for `pending` bookings.
   - "My Bookings" link added to client Navbar. Role-aware links added to Navbar for both roles.

3. ✅ **Client cancel booking**
   - Backend: guard on `PATCH /bookings/:id/status` — clients may only set `pending → cancelled` on their own bookings.
   - Frontend: Cancel button on the client bookings page.
   - Bonus: `cancelled_by` field tracks whether client or contractor cancelled.

---

### Tier 2 — Quick Wins (Low Effort, High Value)

4. ✅ **More contractor profile fields**
   - Add: `location` (city/region), `years_experience` (int), `website` (URL), `phone` (string), `contact_email`.
   - These enrich the public profile display and the AI assistant context automatically.
   - Backend: new nullable columns on `ContractorProfile`. Frontend: new inputs on the profile edit page.

5. ✅ **Contractor can reschedule a booking**
   - `PATCH /api/bookings/{id}/reschedule` — contractor only, updates `scheduled_at` on `pending` or `confirmed` bookings.
   - Frontend: date + time picker in the expanded row of the contractor CRM.
   - **TODO (email):** When a contractor reschedules, publish a `booking.rescheduled` event to Service Bus → worker emails the client with the new date/time.

7. **More email notifications via Service Bus**
   - Currently only fires when a booking is created (email to contractor).
   - Extend: when contractor confirms or declines, publish a new Service Bus message → worker sends email to the client.
   - Same queue, same worker — add an `event_type` field (`booking_created` / `booking_confirmed` / `booking_cancelled` / `booking_rescheduled`) to route the right template.

8. **Profile completeness indicator**
   - Small progress bar on the contractor profile page.
   - Counts filled optional fields (bio, skills, hourly_rate, location, ai_custom_prompt, profile picture).
   - Purely frontend, no backend changes.

9. ✅ **"Copy profile link" button**
   - One-click button on the contractor profile page that copies `/client/contractors/:id` to clipboard.
   - Shipped as part of Tier 1 item 1.

---

### Tier 3 — Major Features

8. **Pagination for contractor search** ✅ DONE
   - Client-side pagination implemented on the Find Contractors page.
   - Note: server-side pagination (DB-level `OFFSET/LIMIT`) still possible if contractor count grows large, but no urgency.

9. **WebSocket real-time chat** (`/chat/:userId`)
   - New `Message` DB table: `id, sender_id, receiver_id, content, created_at, is_read`.
   - Backend: in-memory `ConnectionManager`, WebSocket endpoint at `/api/ws/{user_id}` (token via query param), REST endpoint `GET /api/messages/{other_user_id}` for history.
   - Frontend: shared `/chat/:userId` page used by both roles. Chat button on each booking row (both client and contractor dashboards).
   - Note: in-memory connection manager works for single App Service instance. Can be upgraded to Azure Web PubSub if scaling is needed.

10. **Calendar view on contractor dashboard** ✅ DONE
   - Installed `react-big-calendar` + `date-fns`.
   - Month-only view, events color-coded by status (pending/confirmed/completed).
   - Click day → side panel with all bookings for that day; click booking → detail + action buttons.
   - "View in table" button switches to table view and scrolls to + highlights the row.
   - Calendar respects active status filter and search (uses `visible` array).
   - Dark theme CSS overrides for all calendar elements including popup overlay.
   - Event end time capped to end of day to prevent multi-day spillover.
   - No backend changes needed.

---

### Tier 4 — Nice to Have

10. **Rating & review system** ✅ DONE
    - `Review` DB table, CRUD endpoints (`POST /api/reviews`, `GET /api/reviews/contractor/{id}`, `GET /api/reviews/my-review/{id}`).
    - Client can leave review only after a completed booking with that contractor.
    - Reusable `Stars.jsx` and `ReviewSection.jsx` components (avg rating, distribution bars, submit form, paginated list — 5 per page with Prev/Next controls).
    - Contractor sees their own reviews read-only on their profile page (two-column layout).
    - Client sees reviews + can submit on contractor profile page.
    - `seed_reviews.py` dev script for dummy data (creates fake `User` rows to satisfy FK constraints).

11. **Search & filter improvements on client home**
    - Backend: `GET /contractors` accepts query params (`skill`, `min_rate`, `max_rate`, `location`).
    - Frontend: filter panel on `ClientHome` with dropdowns/sliders.
    - Foundation already exists (search by name/skill is already implemented).
