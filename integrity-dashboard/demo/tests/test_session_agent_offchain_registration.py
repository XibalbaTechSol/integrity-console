"""The session agent joins the fleet through the v3 off-chain registration path.

It used to INSERT its own row into the Oracle database at tier 2, bypassing registration
entirely. It now calls `register_offchain`, and the Oracle assigns the tier.
"""
from unittest import mock

import pytest

from integrity_demo import session_agent as sa
from integrity_sdk.did import Keypair
from integrity_sdk.registration_offchain import OffchainRegistration, OffchainRegistrationError


@pytest.fixture
def wired(monkeypatch):
    kp = Keypair.generate()
    monkeypatch.setattr(sa, "load_or_create_identity", lambda: kp)
    monkeypatch.setattr(sa, "ORACLE_URL", "http://oracle.test")
    client = mock.Mock()
    client.traceable.return_value = lambda fn: fn
    client.flush_telemetry.return_value = True
    client_cls = mock.Mock(return_value=client)
    monkeypatch.setattr(sa, "IntegrityClient", client_cls)
    monkeypatch.setattr(sa.time, "sleep", lambda _s: None)
    monkeypatch.setattr(sa.requests, "get", mock.Mock(side_effect=sa.requests.RequestException("offline")))
    return kp, client_cls, client


def test_registers_offchain_before_emitting_telemetry(wired, monkeypatch):
    kp, client_cls, client = wired
    register = mock.Mock(
        side_effect=lambda url, did, keypair: OffchainRegistration(
            agent_id=did, verification_tier=1, outcome="created", handle=None
        )
    )
    monkeypatch.setattr(sa, "register_offchain", register)

    assert sa.main() == 0

    url, did, keypair = register.call_args.args
    assert url == "http://oracle.test"
    assert keypair is kp
    assert did == f"did:integrity:{sa.fingerprint_for_pubkey(kp.public_bytes())}"
    assert client_cls.call_args.kwargs["agent_id"] == did
    assert client.log_telemetry.call_count == len(sa.SESSION_ACTIONS)


def test_registration_failure_stops_before_any_telemetry(wired, monkeypatch):
    _kp, client_cls, _client = wired
    monkeypatch.setattr(
        sa, "register_offchain", mock.Mock(side_effect=OffchainRegistrationError(503, "cold start"))
    )

    assert sa.main() == 1
    client_cls.assert_not_called()


def test_no_direct_database_write_remains():
    assert not hasattr(sa, "upsert_agent_row")
    assert not hasattr(sa, "DATABASE_URL")
    assert not hasattr(sa, "psycopg")
