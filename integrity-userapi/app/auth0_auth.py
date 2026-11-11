"""Auth0 ID/Access-token verification via JWKS."""
from __future__ import annotations

import jwt
from jwt.jwks_client import PyJWKClient


class Auth0Verifier:
    def __init__(
        self,
        domain: str,
        *,
        client_id: str | None = None,
        audience: str | None = None,
        jwks_client: PyJWKClient | None = None,
    ):
        domain = domain.strip().removeprefix("https://").removeprefix("http://").rstrip("/")
        if not domain:
            raise ValueError("Auth0 domain must not be empty")
        self.domain = domain
        self.issuer = f"https://{domain}/"
        self.expected_audience = client_id or audience
        self.jwks = jwks_client or PyJWKClient(f"{self.issuer}.well-known/jwks.json", timeout=10)

    def verify(self, token: str) -> dict:
        if not token or len(token) > 16384:
            raise ValueError("invalid Auth0 token")
        signing_key = self.jwks.get_signing_key_from_jwt(token)
        decode_options = {"require": ["exp", "iat", "sub", "iss"]}
        decode_kwargs = {
            "algorithms": ["RS256"],
            "issuer": self.issuer,
            "options": decode_options,
        }
        if self.expected_audience:
            decode_options["require"].append("aud")
            decode_kwargs["audience"] = self.expected_audience
        else:
            decode_options["verify_aud"] = False

        claims = jwt.decode(token, signing_key.key, **decode_kwargs)
        return claims
