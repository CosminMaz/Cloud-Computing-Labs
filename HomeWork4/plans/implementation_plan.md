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
