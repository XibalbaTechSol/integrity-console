"""The Console's Cortex bridge must list every agent Cortex lists, not only those with active memories."""
import sqlite3

from app.oracle_routes import cortex_agent_roster

TENANT = "t-97030dfbcc624f369fea981d252855da"


def _graph(path):
    c = sqlite3.connect(path)
    c.executescript("""
        CREATE TABLE sources (id INTEGER PRIMARY KEY, agent_id TEXT, session_id TEXT);
        CREATE TABLE memories (id INTEGER PRIMARY KEY, source_id INTEGER, status TEXT, created_at TEXT);
        CREATE TABLE sessions (session_id TEXT, agent_id TEXT);
        CREATE TABLE agent_devices (device_id TEXT, agent_id TEXT, display_name TEXT, updated_at TEXT);
        INSERT INTO sources VALUES (1,'did:a','s1'),(2,'did:cand','s2'),(3,'did:empty','s3');
        INSERT INTO memories VALUES (1,1,'active','2026-11-01'),(2,2,'candidate','2026-11-02');
        INSERT INTO sessions VALUES ('s9','did:sessiononly');
        INSERT INTO agent_devices VALUES ('d1','did:paired','Laptop','2026-11-03');
    """)
    c.commit(); c.close()


def _tokens(path):
    c = sqlite3.connect(path)
    c.executescript("""
        CREATE TABLE ingest_tokens (label TEXT, agent_id TEXT, agent_ids_json TEXT, profile_id TEXT, revoked_at TEXT);
        INSERT INTO ingest_tokens VALUES ('managed-api:codex@x.com', NULL, '["did:a","did:tokenonly"]', '%s', NULL);
        INSERT INTO ingest_tokens VALUES ('managed-api:old@x.com', 'did:revoked', NULL, '%s', '2026-10-01');
    """ % (TENANT, TENANT))
    c.commit(); c.close()


def test_roster_is_the_union_cortex_serves(tmp_path):
    g, t = tmp_path / "g.sqlite3", tmp_path / "t.sqlite3"
    _graph(g); _tokens(t)
    by_id = {a["agent_id"]: a for a in cortex_agent_roster(g, t)}
    assert set(by_id) == {"did:a", "did:cand", "did:empty", "did:sessiononly", "did:paired", "did:tokenonly"}
    assert by_id["did:cand"]["memories"] == 1       # candidate-only agent was previously dropped
    assert by_id["did:a"]["agent_name"] == "codex"
    assert by_id["did:paired"]["device_name"] == "Laptop"
    assert by_id["did:tokenonly"]["memories"] == 0
    assert "did:revoked" not in by_id


def test_roster_serves_without_identity_snapshot(tmp_path):
    g = tmp_path / "g.sqlite3"; _graph(g)
    assert "did:a" in {a["agent_id"] for a in cortex_agent_roster(g, None)}
