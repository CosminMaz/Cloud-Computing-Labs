import time
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

# Simple in-memory token cache — tokens last 1 hour, we refresh 5 min early
_cached_token: str | None = None
_token_expiry: float = 0.0


def _get_app_token() -> str:
    """Gets an app-only Graph token via client credentials, with caching."""
    global _cached_token, _token_expiry

    if _cached_token and time.time() < _token_expiry:
        return _cached_token

    url = (
        f"https://login.microsoftonline.com/{settings.ENTRA_TENANT_ID}"
        "/oauth2/v2.0/token"
    )
    data = {
        "grant_type": "client_credentials",
        "client_id": settings.ENTRA_BACKEND_CLIENT_ID or settings.ENTRA_CLIENT_ID,
        "client_secret": settings.ENTRA_CLIENT_SECRET,
        "scope": "https://graph.microsoft.com/.default",
    }
    with httpx.Client(timeout=10) as client:
        resp = client.post(url, data=data)
        if resp.status_code != 200:
            print(f"Token error: {resp.text}")
            return None
        body = resp.json()

    _cached_token = body["access_token"]
    _token_expiry = time.time() + body.get("expires_in", 3600) - 300  # 5 min buffer
    return _cached_token


def get_user_email_from_graph(oid: str) -> str | None:
    """
    Looks up a user in the Entra External ID tenant by OID and returns their
    sign-in email address. Returns None on any failure so callers can fall back.

    Requires the app registration to have the 'User.Read.All' application
    permission with admin consent granted.
    """
    if not settings.ENTRA_CLIENT_SECRET:
        logger.warning("ENTRA_CLIENT_SECRET not set — skipping Graph email lookup")
        return None

    try:
        token = _get_app_token()
        url = (
            f"https://graph.microsoft.com/v1.0/users/{oid}"
            "?$select=mail,identities"
        )
        headers = {"Authorization": f"Bearer {token}"}
        with httpx.Client(timeout=10) as client:
            resp = client.get(url, headers=headers)

        if resp.status_code != 200:
            logger.warning(
                "Graph API returned %d for OID %s: %s",
                resp.status_code, oid, resp.text,
            )
            return None

        data = resp.json()

        # `mail` is set for synced/invited accounts
        if data.get("mail"):
            return data["mail"]

        # For CIAM sign-up accounts the email lives in the identities collection
        for identity in data.get("identities", []):
            if identity.get("signInType") == "emailAddress":
                return identity["issuerAssignedId"]

        return None

    except Exception:
        logger.exception("Failed to fetch email from Graph for OID %s", oid)
        return None
