import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useEffect } from "react";
import { getMe } from "../services/api";

let profileSynced = false;

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useIsAuthenticated();
    const { instance, accounts, inProgress } = useMsal();

    useEffect(() => {
        if (!isAuthenticated && inProgress === "none") {
            instance.loginRedirect().catch(e => console.error(e));
        }
    }, [isAuthenticated, inProgress, instance]);

    useEffect(() => {
        if (!isAuthenticated || profileSynced || accounts.length === 0) return;
        profileSynced = true;
        instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] })
            .then(({ idToken }) => getMe(idToken))
            .catch(() => {});
    }, [isAuthenticated, instance, accounts]);

    if (!isAuthenticated) {
        return <div>Loading authentication...</div>;
    }

    return children;
};

export default ProtectedRoute;
