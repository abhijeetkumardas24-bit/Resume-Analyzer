"""
Optional JWT verification for Supabase Auth.
Set SUPABASE_JWT_SECRET in .env (from Supabase Project Settings -> API -> JWT Secret)
to validate Bearer token and use token sub as user_id; otherwise user_id from body is used.
"""
import os
from typing import Optional

from fastapi import Header, HTTPException

def get_verified_user_id(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    If SUPABASE_JWT_SECRET is set and Authorization: Bearer <token> is present,
    verify the JWT and return the sub (user id). Otherwise return None.
    Raises HTTPException 401 if token is present but invalid.
    """
    secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()
    if not secret:
        return None
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:].strip()
    if not token:
        return None
    try:
        import jwt
        payload = jwt.decode(
            token,
            secret,
            audience="authenticated",
            algorithms=["HS256"],
        )
        return payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
