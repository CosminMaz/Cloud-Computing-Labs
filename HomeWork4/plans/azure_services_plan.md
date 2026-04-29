# Cloud Computing Homework 4 & Final Project Plan

This document outlines the evaluation of your project idea, a proposed scope for Homework 4, and an architectural plan detailing the 9 Azure services required for a team of 4 people, keeping the $100 student budget in mind.

## 1. Idea Analysis & Feedback

Your core idea—a platform connecting solo contractors (electricians, handymen) with clients, acting as a light CRM for contractors and a marketplace for clients—is **excellent and highly suitable** for a cloud-based architecture.

**Strengths against requirements:**
- **Multi-tier approach:** It naturally splits into a frontend (marketplace & CRM dashboard), backend (business logic), and persistence layer (databases, storage).
- **Scale:** It provides plenty of opportunities to decouple features into microservices or serverless functions (e.g., chat, emails, notifications), making the "9 services" requirement for 4 people easily achievable.
- **Business Component:** The marketplace model has a clear, understandable business value (which hits the "Business Model Canvas" requirement for the final project).

**Areas to improve for the Final Project (Innovation):**
The final project requires a clear element of **innovation**. A basic directory and booking system is standard. To score high on innovation, consider adding:
*   *Smart Matching Algorithm:* Suggest contractors based on location, availability overlap, and past reviews.
*   *AI Triage / Estimation:* Clients upload a photo of their problem (e.g., a broken pipe). Azure AI Services analyzes it to automatically categorize the issue and give a rough price estimate before they even chat with the contractor.

## 2. Scope: Homework 4 vs. Final Project

To manage the workload and save the most complex features for the final project, we should implement a "vertical slice" for HW4.

### Homework 4 Capabilities (The "MVP" Core)
The focus here is **infrastructure, orchestration, and persistence**.
*   **Authentication & Profiles:** Basic registration for Contractors and Clients. Contractors can set up a profile (name, category, small description).
*   **Search & Listing:** Clients can view a list of contractors and filter them by category (e.g., plumbing, electrical).
*   **File Storage:** Contractors can upload a profile picture.
*   **Simple Booking & Notification:** Clients can request an appointment. This triggers an asynchronous process that sends an automated confirmation/notification email to the contractor.
*   **Basic Chatbot Triage:** A simple chatbot interface for the contractor's profile where clients can ask FAQs ("What are your hours?", "Do you do emergency calls?") before booking.

### Final Project Capabilities (The "Expansion")
*   **Full Calendar Management:** Real-time scheduling, adjusting availability, sync with external calendars.
*   **Live Chat:** Real-time WebSocket-based chat between clients and contractors.
*   **Advanced AI Features:** Smart pricing estimation from images or intelligent routing.
*   **Invoice/Billing Mockup:** Financial management features for the CRM side.
*   **Monitoring & Dashboards:** Complex dashboards for the contractor to see their stats.

## 3. Azure Services Architecture (Choosing 9 Services)

For a team of 4, you **must use 9 Cloud Services/APIs**. Here is a proposed architecture that utilizes 9 Azure services, designed to be completely free or cost pennies, perfectly fitting your $100 student credit limit.

> [!TIP]
> **Cost Management:** Always check the "Free Tier" limits for these services in the Azure portal when creating them. Avoid creating "Standard" or "Premium" tier resources unless strictly necessary, and always set up Azure Cost Alerts for $10 and $20 to avoid surprises.

### Frontend Layer
**1. Azure Static Web Apps**
*   **Purpose:** Host your client and contractor frontend (React, Vue, or Angular).
*   **Cost:** Has a generous completely Free tier.

### Backend & API Layer
**2. Azure App Service (Web Apps)**
*   **Purpose:** Host your primary backend API (Node.js, .NET, Python, etc.) handling user management, search logic, etc.
*   **Cost:** "Free (F1)" pricing tier is available (limited CPU minutes per day, but plenty for dev/testing).

**3. Microsoft Entra External ID**
*   **Purpose:** Handles user authentication (login, registration, password resets) securely without custom backend code. It is the modern successor to Azure AD B2C.
*   **Cost:** Completely Free for the first 50,000 monthly active users.

### Persistence Data Layer
**4. Azure SQL Database**
*   **Purpose:** Store relational data (Users, Profiles, Bookings, Categories) utilizing strict schemas to ensure data consistency.
*   **Cost:** Azure SQL offers an excellent "Free Offer" (100,000 vCore seconds/month) perfectly suited for this project.

**5. Azure Blob Storage**
*   **Purpose:** Store user profile text, profile pictures, or portfolio images.
*   **Cost:** Only costs a few cents for gigabytes of data.

### Asynchronous & Orchestration Layer
**6. Azure Functions**
*   **Purpose:** Serverless execution for background tasks. For example, when a booking is created, the API drops a message, and the Function picks it up to process the email.
*   **Cost:** "Consumption Plan" gives 1 million free executions per month.

**7. Azure Service Bus (or Azure Storage Queues)**
*   **Purpose:** Message broker. The App Service sends a "Booking Created" message to the Service Bus, which triggers the Azure Function. This demonstrates decoupling (an important cloud paradigm).
*   **Cost:** Basic tier is extremely cheap (fractions of a cent per 10k operations).

### AI & Communication Layer
**8. Azure AI Language (QnA Maker) / Bot Service**
*   **Purpose:** Host a simple conversational chatbot for contractor profiles. We will employ the simplest implementation (a QnA FAQ Bot) where contractors upload a text file with their FAQs, and the bot handles answering them automatically.
*   **Cost:** Standard channels are free. The backing AI Language resource uses a negligible amount of your free student credits.

**9. Azure Communication Services (Email)**
*   **Purpose:** The Azure Function uses this native service to actually send the booking confirmation emails simply and reliably.
*   **Cost:** Provides a free managed domain and allows testing email functionality extremely cheaply/free.

---

## Next Steps

1.  **Select the Tech Stack:** Decide as a team what programming language/frameworks you will use for the frontend (e.g., React, Angular) and backend API (e.g., Node.js, .NET, Python, Java).
2.  **Design the SQL Schema:** Draft an Entity-Relationship (ER) diagram for your Azure SQL database mapping out Users, Contractors, Clients, and Bookings.
3.  **Start Provisioning:** Have one team member create the resource group in the Azure Student subscription and begin provisioning the basic infrastructure (Microsoft Entra External ID, SQL Database, Static Web App, App Service).
