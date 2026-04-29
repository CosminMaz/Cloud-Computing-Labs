import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './authConfig.js';

const msalInstance = new PublicClientApplication(msalConfig);

if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
    msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
}

msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
        const account = event.payload.account;
        msalInstance.setActiveAccount(account);
    }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </React.StrictMode>,
)
