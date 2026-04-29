import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from .config import settings

security = HTTPBearer()

def get_jwks():
    """Fetches the JSON Web Key Set from Microsoft Entra."""
    oidc_url = f"{settings.ENTRA_AUTHORITY}/v2.0/.well-known/openid-configuration"
    try:
        oidc_resp = httpx.get(oidc_url)
        oidc_resp.raise_for_status()
        jwks_uri = oidc_resp.json()["jwks_uri"]
        
        jwks_resp = httpx.get(jwks_uri)
        jwks_resp.raise_for_status()
        return jwks_resp.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch JWKS: {str(e)}")

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Middleware to intercept requests and validate the JWT token."""
    token = credentials.credentials
    try:
        # Extract the header to find the Key ID (kid)
        unverified_header = jwt.get_unverified_header(token)
        jwks = get_jwks()
        
        # Find the specific public key Microsoft used to sign this token
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = key
                break
                
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
