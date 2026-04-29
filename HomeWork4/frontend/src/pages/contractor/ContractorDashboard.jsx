import { useMsal } from "@azure/msal-react";

export default function ContractorDashboard() {
    const { instance, accounts } = useMsal();
    const name = accounts[0] && accounts[0].name;

    const handleLogout = () => {
        instance.logoutRedirect({
            postLogoutRedirectUri: "/",
        });
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Contractor Dashboard</h1>
            <p>Welcome back, {name}!</p>
            <p>Here you will see your upcoming bookings and profile settings.</p>
            <button onClick={handleLogout}>Log Out</button>
        </div>
    );
}
