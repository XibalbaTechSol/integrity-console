"""Supabase Auth access-token verification via JWKS."""
from __future__ import annotations

import ipaddress
import uuid
from urllib.parse import urlsplit

import jwt
from jwt.jwks_client import PyJWKClient


class SupabaseAuthVerifier:
    def __init__(self, project_url: str, *, audience: str = "authenticated", jwks_client: PyJWKClient | None = None):
        parts = urlsplit(project_url)
        host = parts.hostname or ""
        try:
            loopback = host == "localhost" or ipaddress.ip_address(host).is_loopback
        except ValueError:
            loopback = host == "localhost"
        if (parts.scheme != "https" and not (parts.scheme == "http" and loopback)) or not host:
            raise ValueError("Supabase project URL must use HTTPS outside loopback")
        self.issuer = f"{parts.scheme}://{parts.netloc}/auth/v1"
        self.audience = audience
        self.jwks = jwks_client or PyJWKClient(self.issuer + "/.well-known/jwks.json", timeout=10)

    def verify(self, token: str) -> dict:
        if not token or len(token) > 16384:
            raise ValueError("invalid Supabase access token")
        signing_key = self.jwks.get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            issuer=self.issuer,
            audience=self.audience,
            options={"require": ["exp", "iat", "sub", "iss", "aud"]},
        )
        try:
            claims["sub"] = str(uuid.UUID(claims.get("sub", "")))
        except (ValueError, TypeError, AttributeError):
            raise ValueError("Supabase token subject must be a UUID") from None
        if claims.get("role") != "authenticated":
            raise ValueError("Supabase token role is not authenticated")
        return claims
