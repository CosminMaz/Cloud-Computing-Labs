"""
Fetches user data from Microsoft Graph API using client_credentials.
Required app registration setup:
  - API permissions → User.Read.All (Application) → Grant admin consent
  - Certificates & secrets → create a client secret → set ENTRA_CLIENT_SECRET
"""
import httpx
from app.core.config import settings

_graph_token_cache: dict = {"token": None, "expires_at": 0}


def _get_graph_token() -> str:
    import time

    now = time.time()
    if _graph_token_cache["token"] and now < _graph_token_cache["expires_at"] - 60:
        return _graph_token_cache["token"]

    # Standard AAD endpoint for service-to-service (client_credentials)
    token_url = f"https://login.microsoftonline.com/{settings.ENTRA_TENANT_ID}/oauth2/v2.0/token"
    resp = httpx.post(
        token_url,
        data={
            "grant_type": "client_credentials",
            "client_id": settings.ENTRA_CLIENT_ID,
            "client_secret": settings.ENTRA_CLIENT_SECRET,
            "scope": "https://graph.microsoft.com/.default",
        },
        timeout=10,
    )
    resp.raise_for_status()
    body = resp.json()
    _graph_token_cache["token"] = body["access_token"]
    _graph_token_cache["expires_at"] = now + body.get("expires_in", 3600)
    return _graph_token_cache["token"]


def fetch_user_email(oid: str) -> str | None:
    """
    Returns the email address stored in the user's sign-in identities,
    or None if it can't be retrieved (so the caller can fall back gracefully).
    """
    if not settings.ENTRA_CLIENT_SECRET:
        return None

    try:
        token = _get_graph_token()
        resp = httpx.get(
            f"https://graph.microsoft.com/v1.0/users/{oid}",
            params={"$select": "identities"},
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        resp.raise_for_status()
        identities = resp.json().get("identities", [])
        for identity in identities:
            if identity.get("signInType") == "emailAddress":
                return identity.get("issuerAssignedId")
    except Exception:
        pass

    return None
