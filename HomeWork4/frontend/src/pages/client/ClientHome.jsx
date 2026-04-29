import { useMsal } from "@azure/msal-react";
import { useState } from "react";
import axios from "axios";

export default function ClientHome() {
    const { instance, accounts } = useMsal();
    const name = accounts[0] && accounts[0].name;
    const [backendResponse, setBackendResponse] = useState("");

    const handleLogout = () => {
        instance.logoutRedirect({
            postLogoutRedirectUri: "/",
        });
    };

    const testBackend = async () => {
        try {
            // 1. Get the raw JWT token silently from MSAL
            const response = await instance.acquireTokenSilent({
                scopes: ["openid", "profile", "email"],
                account: accounts[0]
            });

            // 2. Send it to our FastAPI backend
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
            const res = await axios.get(`${apiUrl}/api/me`, {
                headers: {
                    Authorization: `Bearer ${response.idToken}`
                }
            });
            
            // 3. Display the response!
            setBackendResponse(JSON.stringify(res.data, null, 2));
        } catch (error) {
            console.error(error);
            setBackendResponse("Error testing backend. Is FastAPI running on port 8000?");
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Client Dashboard</h1>
            <p>Welcome back, {name}!</p>
            <p>Here you will be able to search for contractors and book appointments.</p>
            
            <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
                <h3>Test Phase 1 Architecture</h3>
                <button onClick={testBackend}>Test Backend Authentication</button>
                {backendResponse && (
                    <pre style={{ marginTop: '10px', background: '#f4f4f4', padding: '10px' }}>
                        {backendResponse}
                    </pre>
                )}
            </div>

            <br />
            <button onClick={handleLogout}>Log Out</button>
        </div>
    );
}
