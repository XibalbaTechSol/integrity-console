"""
The Oracle-compatible routes the hosted console reads (`ORACLE_URL` = this service when
hosted) must come from the REAL integrity-oracle, not this service's database copy:
only the real Oracle knows the v3 `onchain` record, and the old copy read the retired
v2 `agent_primitives` table. The wallet route must never fabricate data.

Uses the real local HTTP stand-in (`fake_oracle`), never a mock of `oracle_client`.
"""

from __future__ import annotations

import json

import httpx

DID = "did:integrity:" + "ab" * 32
ONCHAIN = {"actor": "0x" + "1" * 40, "domain": "general.integrity", "retired": False}


async def test_agent_passes_through_the_real_oracle_including_onchain(client: httpx.AsyncClient, fake_oracle) -> None:
    body = {"id": DID, "verification_tier": 1, "onchain": ONCHAIN, "settlement_eligible": False}
    fake_oracle.set_response(f"/v1/agent/{DID}", 200, json.dumps(body).encode())
    resp = await client.get(f"/v1/agent/{DID}")
    assert resp.status_code == 200
    assert resp.json() == body


async def test_agent_unknown_to_the_oracle_is_404(client: httpx.AsyncClient, fake_oracle) -> None:
    resp = await client.get(f"/v1/agent/{DID}")  # fake_oracle answers 404 for unknown paths
    assert resp.status_code == 404


async def test_agent_with_oracle_unreachable_and_no_copy_is_503_not_404(client: httpx.AsyncClient) -> None:
    # conftest points ORACLE_URL at a closed port; "can't reach the Oracle" must not read as
    # "this agent doesn't exist".
    resp = await client.get(f"/v1/agent/{DID}")
    assert resp.status_code == 503
    assert "unreachable" in resp.json()["detail"]


async def test_agents_list_passes_through(client: httpx.AsyncClient, fake_oracle) -> None:
    rows = [{"id": DID, "controller": "0x" + "2" * 40, "handle": "x.integrity", "verification_tier": 1}]
    fake_oracle.set_response("/v1/agents", 200, json.dumps(rows).encode())
    resp = await client.get("/v1/agents")
    assert resp.status_code == 200
    assert resp.json() == rows


async def test_wallet_passes_through_the_real_oracle(client: httpx.AsyncClient, fake_oracle) -> None:
    wallet = {"agent_id": DID, "sovereign_agent": ONCHAIN["actor"], "itk_balance": "1000000000000000000"}
    fake_oracle.set_response(f"/v1/agent/{DID}/wallet", 200, json.dumps(wallet).encode())
    resp = await client.get(f"/v1/agent/{DID}/wallet")
    assert resp.status_code == 200
    assert resp.json() == wallet


async def test_wallet_is_never_fabricated(client: httpx.AsyncClient, fake_oracle) -> None:
    resp = await client.get(f"/v1/agent/{DID}/wallet")  # Oracle: 404, no on-chain wallet
    assert resp.status_code == 404
    assert "2500.00" not in resp.text and "0x52f9ea21" not in resp.text


async def test_wallet_with_oracle_unreachable_is_503(client: httpx.AsyncClient) -> None:
    resp = await client.get(f"/v1/agent/{DID}/wallet")
    assert resp.status_code == 503
    assert "2500.00" not in resp.text
