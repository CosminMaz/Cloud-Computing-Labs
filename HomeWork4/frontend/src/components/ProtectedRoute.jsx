import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useEffect } from "react";

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useIsAuthenticated();
    const { instance, inProgress } = useMsal();

    useEffect(() => {
        if (!isAuthenticated && inProgress === "none") {
            instance.loginRedirect().catch(e => console.error(e));
        }
    }, [isAuthenticated, inProgress, instance]);

    if (!isAuthenticated) {
        return <div>Loading authentication...</div>;
    }

    return children;
};

export default ProtectedRoute;
