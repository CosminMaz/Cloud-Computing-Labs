# Development Roadmap (Homework 4)

Your instinct is **100% correct**. Authentication is the linchpin of this architecture. Because the entire user experience (Client vs. Contractor) pivots on who is logged in, you must build the Identity and Routing skeleton first. 

Here is the optimal, phased roadmap to build your Minimal Working Example (MVP) while keeping all 4 team members unblocked.

---

## Phase 1: Identity & The Skeleton (Start Here)
**Goal:** A React app that forces you to log in, determines if you are a Client or Contractor, and routes you to the correct (but empty) dashboard.

**Azure Tasks:**
1.  **Entra External ID Configuration:** Inside your Entra tenant, create an "App Registration" for your React frontend. Create your "User Flows" (Sign up / Sign in). Ensure the token returns a custom attribute (like `userType`) to distinguish Clients from Contractors.

**Code Tasks:**
1.  **Frontend Auth:** Integrate `@azure/msal-react` (Microsoft Authentication Library) into your React app.
2.  **React Routing:** Set up `react-router-dom`. Create `ProtectedRoute` wrappers.
3.  **UI Stubs:** Build extremely simple, empty placeholder pages:
    *   `/client/home` (Shows: "Welcome Client")
    *   `/contractor/dashboard` (Shows: "Welcome Contractor")
4.  **Backend Auth Stub:** Set up FastAPI with a single `/api/me` route that requires a valid JWT token, just to prove your backend can validate Entra ID tokens.

---

## Phase 2: Database & Core API (The Engine)
**Goal:** The frontend can save and retrieve real data from the Azure SQL Database.

**Azure Tasks:**
1.  Ensure your IP address is whitelisted in the Azure SQL Database firewall settings so your local FastAPI app can connect to it.

**Code Tasks:**
1.  **SQLModel Definitions (Backend):** Write the Python classes for `User`, `ContractorProfile`, and `Booking`.
2.  **FastAPI CRUD Routes (Backend):** Write the routes to:
    *   `GET /api/contractors` (List all contractors for the client search page)
    *   `POST /api/bookings` (Create an appointment)
3.  **Frontend Integration:** Replace the UI stubs with real `axios` calls to your FastAPI backend. Build out the Client Search grid and the Contractor Dashboard table so they display real database data.

---

## Phase 3: File Storage & The Marketplace
**Goal:** Contractors can upload profile pictures, and Clients can view beautiful profiles.

**Azure Tasks:**
1.  Retrieve the Connection String for your Azure Blob Storage account and put it in your `.env`.

**Code Tasks:**
1.  **Blob Storage (Backend):** Create a FastAPI route `POST /api/upload-profile-picture`. Write the Python code using the `azure-storage-blob` SDK to stream the image to Azure.
2.  **Frontend Update:** Add an image upload button to the Contractor "Edit Profile" page. Update the Client's "View Profile" page to render the image URL returned from Blob Storage.

---

## Phase 4: Asynchronous Cloud Orchestration (The Magic)
**Goal:** When a client books an appointment, an email is automatically sent in the background.

**Azure Tasks:**
1.  Get the Connection Strings for Azure Service Bus and Email Communication Services.

**Code Tasks:**
1.  **Service Bus Push (Backend):** Update the `POST /api/bookings` route in FastAPI. After it saves the booking to the SQL database, it should push a JSON message (e.g., `{"contractorEmail": "...", "date": "..."}`) to your Azure Service Bus Queue.
2.  **Azure Function (Worker):** Write a Python Azure Function with a "Service Bus Trigger". Whenever a message hits the queue, this function wakes up.
3.  **Email Dispatch (Worker):** Inside that Azure Function, use the `azure-communication-email` SDK to send the invoice/notification to the `contractorEmail`.

---

## Phase 5: AI Integration (The Polish)
**Goal:** Contractors have an automated FAQ answering bot on their profile.

**Azure Tasks:**
1.  Go to Azure Language Studio. Create a "Custom Question Answering" project. Type in 5 or 6 dummy FAQs (e.g., "Do you work weekends? -> No."). Deploy the Knowledge Base and create the Bot Service.

**Code Tasks:**
1.  **Frontend Web Chat:** Grab the `<iframe>` or the JavaScript Web Chat snippet from your Azure Bot Service portal. Embed this component directly into the React "Contractor Profile" page so clients can talk to it!

---

> [!IMPORTANT]
> **Next Steps**
> Does this chronological order make sense to the team? If so, your immediate first technical hurdle is to integrate `@azure/msal-react` into your frontend folder. Let me know when you are ready to tackle that code!
