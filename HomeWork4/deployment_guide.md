# Cloud Deployment Guide

This guide centralizes all deployment commands and explains the difference between how the Backend (FastAPI) and Frontend (React) handle environment variables.

---

## 1. The Core Difference: Dynamic vs. Static

### Backend (FastAPI on Azure App Service)
*   **How it works:** The backend is a *Dynamic* server. It reads environment variables at runtime directly from the Azure Server's memory.
*   **The Rule:** You only need to deploy the backend when you change **Python code**. If you only need to change an environment variable (like a database password or the `FRONTEND_URL`), you do **not** need to redeploy. You just change it in the Azure Portal, and Azure will restart the server to read the new variable.

### Frontend (React on Azure Static Web Apps)
*   **How it works:** React is a *Static* app. Environment variables (like `VITE_API_URL`) are physically baked into the raw Javascript files during the `npm run build` process.
*   **The Rule:** If you change an environment variable in `.env`, you **must** rebuild the app and re-deploy it, otherwise the new variable won't be bundled into the code.

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

---

## 3. Why did it deploy to "Preview" instead of Production?

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
