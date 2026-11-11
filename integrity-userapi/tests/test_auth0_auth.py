"""Unit tests for Auth0 token verification."""
import pytest
from unittest.mock import MagicMock
from app.auth0_auth import Auth0Verifier


def test_auth0_verifier_init():
    verifier = Auth0Verifier("dev-2acdt0dlqgi0pqcu.us.auth0.com", client_id="test_client_id")
    assert verifier.domain == "dev-2acdt0dlqgi0pqcu.us.auth0.com"
    assert verifier.issuer == "https://dev-2acdt0dlqgi0pqcu.us.auth0.com/"
    assert verifier.expected_audience == "test_client_id"


def test_auth0_verifier_invalid_domain():
    with pytest.raises(ValueError, match="Auth0 domain must not be empty"):
        Auth0Verifier("")


def test_auth0_verifier_empty_token():
    verifier = Auth0Verifier("dev-2acdt0dlqgi0pqcu.us.auth0.com")
    with pytest.raises(ValueError, match="invalid Auth0 token"):
        verifier.verify("")


def test_auth0_verifier_token_too_long():
    verifier = Auth0Verifier("dev-2acdt0dlqgi0pqcu.us.auth0.com")
    with pytest.raises(ValueError, match="invalid Auth0 token"):
        verifier.verify("a" * 17000)
