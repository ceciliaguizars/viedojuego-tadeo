from __future__ import annotations

import argparse
import hashlib
import secrets

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from fastapi import HTTPException, Request, status
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from .config import settings


ADMIN_COOKIE = "tadeo_admin"
ADMIN_MAX_AGE_SECONDS = 8 * 60 * 60
password_hasher = PasswordHasher()
serializer = URLSafeTimedSerializer(settings.secret_key, salt="tadeo-admin-v1")


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def new_access_token() -> str:
    return secrets.token_urlsafe(32)


def verify_admin_password(password: str) -> bool:
    if not settings.admin_password_hash:
        return False
    try:
        return password_hasher.verify(settings.admin_password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def create_admin_cookie() -> str:
    return serializer.dumps({"role": "admin"})


def admin_is_authenticated(request: Request) -> bool:
    cookie = request.cookies.get(ADMIN_COOKIE)
    if not cookie:
        return False
    try:
        payload = serializer.loads(cookie, max_age=ADMIN_MAX_AGE_SECONDS)
    except (BadSignature, SignatureExpired):
        return False
    return payload.get("role") == "admin"


def require_admin(request: Request) -> None:
    if not admin_is_authenticated(request):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Acceso administrativo requerido")


def csrf_token() -> str:
    return serializer.dumps({"purpose": "csrf"})


def verify_csrf(value: str) -> bool:
    try:
        payload = serializer.loads(value, max_age=ADMIN_MAX_AGE_SECONDS)
    except (BadSignature, SignatureExpired):
        return False
    return payload.get("purpose") == "csrf"


def require_csrf(value: str) -> None:
    if not verify_csrf(value):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Formulario expirado")


def main() -> None:
    parser = argparse.ArgumentParser(description="Herramientas de seguridad del panel")
    parser.add_argument("command", choices=["hash-password"])
    args = parser.parse_args()
    if args.command == "hash-password":
        import getpass

        password = getpass.getpass("Contraseña administrativa: ")
        confirmation = getpass.getpass("Repite la contraseña: ")
        if not password or password != confirmation:
            raise SystemExit("Las contraseñas no coinciden o están vacías.")
        print(password_hasher.hash(password))


if __name__ == "__main__":
    main()

