# Azure Portal Setup Walkthrough

This guide will walk you through setting up your entire Azure infrastructure using the Azure Portal web interface. It is designed to maximize your student credits by ensuring you select the "Free" or cheapest tiers available.

> [!CAUTION]
> **Important Note on Pricing:** Cloud pricing interfaces change frequently. Always double-check that you are selecting a "Free (F1)", "Basic", or "Consumption" tier before clicking "Create".

---

## Phase 1: The Foundation

### 1. Create the Resource Group
The Resource Group is the folder that will hold all your project's services.
1. Log into `portal.azure.com`.
2. In the top search bar, search for **Resource groups** and click it.
3. Click **+ Create**.
4. **Subscription:** Ensure your Student subscription is selected.
5. **Resource group:** Name it (e.g., `Cloud-HW4-RG`).
6. **Region:** Select a region close to you (e.g., `West Europe` or `North Europe`). *Note: Try to put all your subsequent resources in this exact same region to minimize latency.*
7. Click **Review + create**, then **Create**.

### 2. Add Your Teammates (IAM)
1. Go into your newly created `Cloud-HW4-RG`.
2. On the left-hand menu, click **Access control (IAM)**.
3. Click **+ Add** at the top, then select **Add role assignment**.
4. Under the "Privileged administrator roles" or "Job function roles" tab, find and select **Contributor**. Click **Next**.
5. Ensure "Assign access to" is set to **User, group, or service principal**.
6. Click **+ Select members**. Search for your teammates using their university emails and select them.
7. Click **Review + assign**. They will now see this Resource Group when they log into their Azure Portals.

---

## Phase 2: Core Infrastructure Setup

### 3. Azure SQL Database
1. Search for **SQL databases** and click **+ Create**.
2. **Resource Group:** Select `Cloud-HW4-RG`.
3. **Database name:** e.g., `hw4-database`.
4. **Server:** Click **Create new**. Name it, choose a secure admin login and password (save these!), and set the region.
5. **Compute + storage:** Click **Configure database**. This is the most important step. Look for the "Apply Free Offer" button if available. If not, switch to the **DTU-based purchasing model** and select **Basic** (which costs about ~$5/month, highly affordable for your credits). 
6. Click **Review + create**, then **Create**.

### 4. Azure App Service (Backend FastAPI)
1. Search for **App Services** and click **+ Create** -> **Web App**.
2. **Resource Group:** `Cloud-HW4-RG`.
3. **Name:** e.g., `hw4-fastapi-backend`.
4. **Publish:** Select **Code**.
5. **Runtime stack:** Select **Python 3.11** (or whichever version you use).
6. **Operating System:** Linux.
7. **Pricing plan:** Click **Explore pricing plans**. Select the **Free (F1)** tier.
8. Click **Review + create**, then **Create**.

### 5. Azure Static Web Apps (Frontend React)
1. Search for **Static Web Apps** and click **+ Create**.
2. **Resource Group:** `Cloud-HW4-RG`.
3. **Name:** e.g., `hw4-react-frontend`.
4. **Plan type:** Select **Free**.
5. **Deployment details:** You can either sign into GitHub now and select your repository, or choose "Other" to set it up later.
6. Click **Review + create**, then **Create**.

---

## Phase 3: Auth & Storage

### 6. Microsoft Entra External ID
> [!WARNING]
> Microsoft Entra External ID (the successor to Azure AD B2C) is unique. It actually creates an entirely separate "Tenant" (directory) from your main student directory.
1. Click **Create a resource** and search for **External Identities** or **Entra External ID** in the Marketplace. Click **Create**.
2. Select **Create a new tenant**.
3. **Organization name** and **Initial domain name:** Choose names for your app (e.g., `hw4auth`). 
4. **Resource Group:** Select `Cloud-HW4-RG`.
5. Click **Review + create**.
*Note: To manage this resource later, you will actually have to switch your Azure Portal directory using the settings gear icon in the top right corner. (If you already have a standard App Registration from a previous project, it will not give you the fully-hosted signup/login pages that External ID provides).*

### 7. Azure Blob Storage (Storage account)
1. Search for **Storage accounts** and click **+ Create**.
2. **Resource Group:** `Cloud-HW4-RG`.
3. **Storage account name:** Must be all lowercase letters and numbers (e.g., `hw4blobstorage123`).
4. **Performance:** Standard.
5. **Redundancy:** Select **Locally-redundant storage (LRS)** (this is the cheapest option).
6. Click **Review + create**, then **Create**.

---

## Phase 4: Microservices & AI

### 8. Azure Service Bus
1. Search for **Service Bus** and click **+ Create**.
2. **Resource Group:** `Cloud-HW4-RG`.
3. **Namespace name:** e.g., `hw4-message-bus`.
4. **Pricing tier:** Select **Basic**.
5. Click **Review + create**, then **Create**.

### 9. Azure Functions (Email Worker)
1. Search for **Function App** and click **+ Create**.
2. **Hosting option:** Select **Consumption** (Serverless). *(Note: If you only see "Flex Consumption", you can select that, but standard "Consumption" is the classic tier with 1 million free executions).*
3. **Resource Group:** `Cloud-HW4-RG`.
4. **Function App name:** e.g., `hw4-email-worker`.
5. **Runtime stack:** Python.
6. **Storage:** It will ask to create a storage account or use an existing one; select the Blob Storage account you made in Step 7.
7. Click **Review + create**, then **Create**.

### 10. Azure Communication Services (Email)
*(Note: SendGrid's free tier is sometimes hidden or restricted for student accounts. We will use Azure's native email service instead, which is extremely cheap/free for testing).*
1. Click **Create a resource**, search for **Email Communication Services**, and click **Create**.
2. **Resource Group:** `Cloud-HW4-RG`. Name it and click **Review + create**.
3. Once created, go to the resource, click **Provision domains**, and select **Add an Azure subdomain** (this gives you a free `.azurecomm.net` email address to send from).
4. Next, search the portal for **Communication Services** and click **Create**. 
5. Put it in your Resource Group. Once created, go to **Domains** on the left menu, and link it to the Email Communication Service domain you just made.

### 11. Azure AI Language (QnA Bot)
1. Search for **Language** (Azure AI services). Click **Create**.
2. Select **Custom question answering**.
3. **Resource Group:** `Cloud-HW4-RG`.
4. **Pricing tier:** Select **Free F0**.
5. **Azure Search pricing tier:** Select **Free F**. (QnA Maker requires an underlying search service, which is free).
6. Click **Create**.
7. *To create the actual bot interface later:* You will go into Language Studio, create a Knowledge Base, and click "Create a Bot", which will generate the Bot Service for you.
