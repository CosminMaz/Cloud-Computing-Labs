# Cloud Deployment Guide

This guide centralizes all deployment commands and explains the difference between how the Backend (FastAPI), Frontend (React), and Functions worker handle environment variables.

---

## 1. The Core Difference: Dynamic vs. Static

### Backend (FastAPI on Azure App Service)
*   **How it works:** The backend is a *Dynamic* server. It reads environment variables at runtime directly from the Azure Server's memory.
*   **The Rule:** You only need to deploy the backend when you change **Python code**. If you only need to change an environment variable (like a database password or the `FRONTEND_URL`), you do **not** need to redeploy. You just change it in the Azure Portal, and Azure will restart the server to read the new variable.

### Frontend (React on Azure Static Web Apps)
*   **How it works:** React is a *Static* app. Environment variables (like `VITE_API_URL`) are physically baked into the raw Javascript files during the `npm run build` process.
*   **The Rule:** If you change an environment variable in `.env`, you **must** rebuild the app and re-deploy it, otherwise the new variable won't be bundled into the code.

### Functions worker (Python on Azure Functions, Consumption plan)
*   **How it works:** Same as the backend — settings are read at runtime from the Function App's **Application settings**.
*   **The Rule:** Code changes require a redeploy; setting changes only need a Save in the portal (the Function App restarts automatically).

---

## 2. Deployment Commands

### Deploying the Backend (FastAPI)
Run these commands whenever you change your Python code:
```bash
cd backend
zip -r backend.zip . -x ".venv/*" "__pycache__/*"
az webapp deployment source config-zip --resource-group HW4-RG --name hw4-fastapi-backend --src backend.zip
```

### Deploying the Frontend (React)
Run these commands whenever you change your React code **or** your frontend `.env` file:
```bash
cd frontend
npm run build
npx @azure/static-web-apps-cli deploy dist --app-name hw4-react-frontend --resource-group HW4-RG
```

### Deploying the Functions worker
Use the Functions Core Tools (installed in the install guide §0):
```bash
cd functions/booking-email-worker
func azure functionapp publish hw4-email-worker --python
```
The `--python` flag forces a remote build of native dependencies (matters for `azure-communication-email`).

---

## 3. App settings — what to configure where (production)

### App Service (`hw4-fastapi-backend`) → Configuration → Application settings
Mirror the backend `.env` (see [`backend/.env.example`](backend/.env.example)):

- `ENTRA_CLIENT_ID`, `ENTRA_TENANT_ID`, `ENTRA_AUTHORITY`
- `FRONTEND_URL` — the deployed Static Web App URL (e.g. `https://...azurestaticapps.net`)
- `DATABASE_URL`
- `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER`
- `AZURE_SERVICE_BUS_CONNECTION_STRING`, `AZURE_SERVICE_BUS_QUEUE`
- `AZURE_LANGUAGE_ENDPOINT`, `AZURE_LANGUAGE_KEY`, `AZURE_LANGUAGE_PROJECT`, `AZURE_LANGUAGE_DEPLOYMENT`

Also confirm the App Service has **CORS** allowing the Static Web App URL.

### Function App (`hw4-email-worker`) → Environment variables → App settings
- `FUNCTIONS_WORKER_RUNTIME` = `python`
- `FUNCTIONS_EXTENSION_VERSION` = `~4`
- `AzureWebJobsStorage` — connection string of any Storage account (typically the same `hw4blobstorage` you already use)
- `SERVICE_BUS_CONNECTION` — Service Bus namespace connection string
- `SERVICE_BUS_QUEUE_NAME` — `booking-events`
- `EMAIL_CONNECTION_STRING` — Communication Services connection string
- `EMAIL_SENDER_ADDRESS` — `DoNotReply@<azure-managed-domain>.azurecomm.net`

### Static Web App build (frontend env vars)
Vite bakes these into the bundle, so set them **before `npm run build`** (locally in `.env`, or as build-time variables in your CI):

- `VITE_ENTRA_CLIENT_ID`, `VITE_ENTRA_TENANT_ID`, `VITE_ENTRA_AUTHORITY`
- `VITE_API_URL` — the deployed App Service URL

---

## 4. Why did it deploy to "Preview" instead of Production?

When you use the `swa-cli` locally using your Azure CLI login, Microsoft forces the deployment into a "Preview" environment to protect your main production URL from accidental laptop pushes.

To bypass this and deploy directly to the **Production** URL, you cannot use your `az login` credentials. You must use the App's specific Deployment Token.

**How to deploy to Production:**
1. Go to the Azure Portal -> **Static Web Apps** -> `hw4-react-frontend`.
2. Click **Manage deployment token** at the top and copy the long string.
3. Run the deployment command with the token flag:
```bash
npx @azure/static-web-apps-cli deploy dist --app-name hw4-react-frontend --resource-group HW4-RG --deployment-token "YOUR_LONG_TOKEN_HERE"
```
*(By providing the token, Azure knows this is an official deployment and will overwrite the Production environment).*
