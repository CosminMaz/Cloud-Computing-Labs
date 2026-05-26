import time
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from .config import settings

security = HTTPBearer()

_jwks_cache: dict | None = None
_jwks_fetched_at: float = 0.0
_JWKS_TTL = 3600  # seconds


def _fetch_jwks() -> dict:
    oidc_url = f"{settings.ENTRA_AUTHORITY}/v2.0/.well-known/openid-configuration"
    oidc_resp = httpx.get(oidc_url)
    oidc_resp.raise_for_status()
    jwks_resp = httpx.get(oidc_resp.json()["jwks_uri"])
    jwks_resp.raise_for_status()
    return jwks_resp.json()


def get_jwks(force: bool = False) -> dict:
    global _jwks_cache, _jwks_fetched_at
    if force or _jwks_cache is None or (time.monotonic() - _jwks_fetched_at) > _JWKS_TTL:
        try:
            _jwks_cache = _fetch_jwks()
            _jwks_fetched_at = time.monotonic()
        except Exception as e:
            if _jwks_cache is not None:
                return _jwks_cache  # serve stale rather than hard-fail
            raise HTTPException(status_code=500, detail=f"Failed to fetch JWKS: {str(e)}")
    return _jwks_cache

def _find_rsa_key(jwks: dict, kid: str) -> dict:
    return next((k for k in jwks["keys"] if k["kid"] == kid), {})


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Middleware to intercept requests and validate the JWT token."""
    token = credentials.credentials
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header["kid"]
        rsa_key = _find_rsa_key(get_jwks(), kid)
        if not rsa_key:
            rsa_key = _find_rsa_key(get_jwks(force=True), kid)
        if not rsa_key:
            raise HTTPException(status_code=401, detail="Invalid token: Public key not found")
            
        # Mathematically decode and validate the token signature!
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=settings.ENTRA_CLIENT_ID,
            options={"verify_iss": False} # Simplified for local CIAM testing
        )
        return payload
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def verify_token_raw(token: str) -> dict:
    """Validate a raw JWT string — used by WebSocket endpoints that can't use HTTPBearer."""
    try:
        kid = jwt.get_unverified_header(token)["kid"]
        rsa_key = _find_rsa_key(get_jwks(), kid)
        if not rsa_key:
            rsa_key = _find_rsa_key(get_jwks(force=True), kid)
        if not rsa_key:
            raise ValueError("Public key not found")
        return jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=settings.ENTRA_CLIENT_ID,
            options={"verify_iss": False},
        )
    except Exception as e:
        raise ValueError(f"Invalid token: {e}")
