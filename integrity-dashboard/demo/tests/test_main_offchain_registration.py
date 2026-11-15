"""The demo registers its personas the v3 way: gasless, off-chain, at the Oracle.

No funder key, RPC or on-chain primitives are involved (registration v3 PR 3.3).
"""
from contextlib import nullcontext
from unittest import mock

import pytest

from integrity_demo import main as demo
from integrity_sdk.registration_offchain import OffchainRegistration, OffchainRegistrationError


class _Tracer:
    def start_as_current_span(self, _name):
        return nullcontext()


@pytest.fixture
def scenario(monkeypatch):
    monkeypatch.setattr(demo, "_tracer_for", lambda _did: _Tracer())
    telemetry = mock.Mock()
    monkeypatch.setattr(demo, "_submit_telemetry", telemetry)
    monkeypatch.setattr(
        demo, "load_or_create_did", lambda name: (f"did:integrity:{name}", mock.sentinel.keypair, None)
    )
    register = mock.Mock(
        side_effect=lambda url, did, kp: OffchainRegistration(
            agent_id=did, verification_tier=1, outcome="created", handle=None
        )
    )
    monkeypatch.setattr(demo, "register_offchain", register)
    return register, telemetry


def test_every_persona_registers_offchain_at_the_oracle(scenario, monkeypatch):
    register, telemetry = scenario
    monkeypatch.setattr(demo, "ORACLE_URL", "http://oracle.test")

    summary = demo._run_scenario()

    dids = [c.args[1] for c in register.call_args_list]
    assert dids == [
        "did:integrity:healthcare_agent",
        "did:integrity:prediction_market_agent",
        "did:integrity:trading_agent",
        "did:integrity:capital_allocation_agent",
    ]
    assert all(c.args[0] == "http://oracle.test" and c.args[2] is mock.sentinel.keypair for c in register.call_args_list)
    assert summary["agents_attempted"] == 4
    assert summary["agents_registered"] == sorted(
        ["healthcare_agent", "prediction_market_agent", "trading_agent", "capital_allocation_agent"]
    )
    assert summary["registrations"]["trading_agent"] == {
        "did": "did:integrity:trading_agent",
        "verification_tier": 1,
        "outcome": "created",
    }
    assert "sovereign_agent_addresses" not in summary
    assert telemetry.call_count == 4


def test_one_failed_registration_does_not_abort_the_rest(scenario):
    register, telemetry = scenario
    ok = register.side_effect

    def flaky(url, did, kp):
        if did.endswith("trading_agent"):
            raise OffchainRegistrationError(503, "oracle cold start")
        return ok(url, did, kp)

    register.side_effect = flaky

    summary = demo._run_scenario()

    assert "trading_agent" not in summary["agents_registered"]
    assert len(summary["agents_registered"]) == 3
    assert telemetry.call_count == 3


def test_the_primitives_path_is_gone():
    assert not hasattr(demo, "register_agent")
    assert not hasattr(demo, "_check_funder_balance")
