"""JWT + password hashing + RBAC middleware."""
import bcrypt, jwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from config import JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_MIN, ROLE_PERMISSIONS

bearer = HTTPBearer(auto_error=False)


def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def make_access_token(uid: str, role: str) -> str:
    payload = {
        "sub": uid,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRES_MIN),
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def make_refresh_token(uid: str) -> str:
    payload = {
        "sub": uid,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "type": "refresh",
    }
    return jwt.encode(payload, JWT_REFRESH_SECRET, algorithm="HS256")


def decode_token(token: str, refresh: bool = False) -> dict:
    secret = JWT_REFRESH_SECRET if refresh else JWT_SECRET
    try:
        return jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> dict:
    if not creds:
        raise HTTPException(401, "Not authenticated")
    payload = decode_token(creds.credentials)
    return {"id": payload["sub"], "role": payload.get("role", "customer")}


async def get_current_user_optional(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> Optional[dict]:
    if not creds:
        return None
    try:
        payload = decode_token(creds.credentials)
        return {"id": payload["sub"], "role": payload.get("role", "customer")}
    except HTTPException:
        return None


def require_roles(*roles: str):
    async def _dep(user: dict = Depends(get_current_user)):
        if user["role"] not in roles and user["role"] != "super_admin":
            raise HTTPException(403, f"Requires one of roles: {roles}")
        return user
    return _dep


def require_permission(perm: str):
    async def _dep(user: dict = Depends(get_current_user)):
        role = user["role"]
        if role == "super_admin":
            return user
        if perm not in ROLE_PERMISSIONS.get(role, []):
            raise HTTPException(403, f"Missing permission: {perm}")
        return user
    return _dep
