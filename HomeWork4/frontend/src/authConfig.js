export const msalConfig = {
    auth: {
        clientId: import.meta.env.VITE_ENTRA_CLIENT_ID,
        authority: import.meta.env.VITE_ENTRA_AUTHORITY,
        knownAuthorities: ["hw4auth.ciamlogin.com"],
        redirectUri: "/",
        postLogoutRedirectUri: "/",
    },
    cache: {
        cacheLocation: "sessionStorage", 
        storeAuthStateInCookie: false,
    }
};

export const loginRequest = {
    scopes: ["openid", "profile", "email"]
};
