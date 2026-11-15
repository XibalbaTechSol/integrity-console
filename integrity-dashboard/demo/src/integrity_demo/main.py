import os
import logging

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from integrity_sdk.registration_offchain import register_offchain
from integrity_sdk.did import load_or_create_did
from integrity_sdk.client import IntegrityClient

from integrity_demo import userapi_bridge

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("integrity_demo.main")

OTLP_ENDPOINT = "http://localhost:4317"
# Registration v3: personas register gasless and off-chain at the Oracle
# (`POST /v1/agent/register/offchain`). No funder key, RPC or on-chain
# primitives -- the same default the SDK, CLI and Shield use.
ORACLE_URL = os.getenv("ORACLE_URL", "http://localhost:8080")

# Per-agent OTel tracers, deliberately NOT installed as the process-global
# provider. `opentelemetry.trace.set_tracer_provider` (and this SDK's own
# `telemetry/core.py::init_telemetry`, which wraps it) is a one-shot global
# -- the first call wins, every later call is a silent no-op. This engine
# registers 4 independent agent identities in one process, and the oracle's
# real OTLP receiver requires a genuine `integrity.agent.id` resource
# attribute on every span it accepts. The old code here built ONE shared
# module-level Resource with no such attribute at all, so every span this
# engine ever exported was rejected -- found by actually running this
# against a real oracle, not by inspection (see PRODUCTION_GAPS.md).
# Building one TracerProvider per agent and using it directly via
# `.get_tracer()`, never through the global setter, is the standard
# OTel pattern for several independent resources coexisting in one process.
_tracers: dict = {}
_tracer_providers: dict = {}
# Real IntegrityClient instances, one per agent, used ONLY for
# log_telemetry()/flush_telemetry() (POST /v1/telemetry/ingest) -- kept
# entirely separate from the OTel tracer machinery above. Before this, this
# engine only ever emitted OTel spans; it never called the SDK's telemetry-
# submission path at all, so `telemetry_events` (the table AIS's
# entropy/grounding/sacrifice/compliance signals are actually derived from)
# stayed empty for every demo agent forever, regardless of how many times
# the demo ran -- confirmed by querying the oracle directly after a real run
# and finding zero rows despite real OTel spans/traces existing. `enable_
# otel_export=False` here is deliberate: IntegrityClient.__init__ would
# otherwise call telemetry_core.init_telemetry(), which installs a GLOBAL
# TracerProvider (see that function's own one-shot-singleton warning) --
# exactly the trap `_tracer_for`'s per-agent providers above were built to
# avoid for this same multi-agent-in-one-process engine. OTel tracing and
# telemetry-event submission are two independent real pipelines here, not
# one going through the other.
_clients: dict = {}


def _client_for(agent_id: str, keypair) -> IntegrityClient:
    if agent_id not in _clients:
        _clients[agent_id] = IntegrityClient(agent_id=agent_id, keypair=keypair, enable_otel_export=False)
    return _clients[agent_id]


def _submit_telemetry(agent_did: str, keypair, metadata: dict) -> None:
    """Best-effort, matching this module's existing tolerance for telemetry/
    tracing failures not aborting the run (see _flush_all_tracers' docstring
    for the same posture applied to OTel spans). A failed submission here
    means one demo agent's AIS stays at "no data yet" for this run, not that
    registration or capital allocation should be considered failed."""
    try:
        client = _client_for(agent_did, keypair)
        client.log_telemetry(metadata)
        if not client.flush_telemetry():
            logger.warning("telemetry flush for %s was not accepted by the oracle", agent_did)
    except Exception:
        logger.warning("failed to submit telemetry for %s", agent_did, exc_info=True)


def _tracer_for(agent_id: str):
    if agent_id not in _tracers:
        resource = Resource.create(
            {
                "service.name": "integrity-demo-scenario-engine",
                "integrity.agent.id": agent_id,
            }
        )
        provider = TracerProvider(resource=resource)
        provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=OTLP_ENDPOINT, insecure=True)))
        _tracer_providers[agent_id] = provider
        _tracers[agent_id] = provider.get_tracer(__name__)
    return _tracers[agent_id]


def _flush_all_tracers() -> None:
    """`BatchSpanProcessor` buffers spans and exports on a timer/batch-size
    threshold -- nothing forces a flush on process exit. Without this, any
    span still sitting in the buffer when this short-lived script's process
    exits is silently dropped, never reaching the oracle's OTLP receiver
    (found by actually running the demo and checking the oracle's real
    otel_spans table came up empty, not by inspection)."""
    for agent_id, provider in _tracer_providers.items():
        try:
            provider.force_flush(timeout_millis=5000)
            provider.shutdown()
        except Exception:
            logger.warning("failed to flush OTel spans for %s", agent_id, exc_info=True)


def main():
    logger.info("Initializing Integrity Demo Scenario Engine")
    # No-op unless USERAPI_URL/USERAPI_TOKEN/USERAPI_RUN_ID are all set (see
    # userapi_bridge.py's module docstring) -- lets an operator tie this run
    # back to a demo_runs row created via POST /demo/run beforehand.
    userapi_bridge.report_status("running")

    try:
        summary = _run_scenario()
    except Exception as exc:
        userapi_bridge.report_status("failed", {"error": str(exc)})
        raise
    else:
        userapi_bridge.report_status("completed", summary)
    finally:
        _flush_all_tracers()


def _run_scenario() -> dict:
    agents = [
        {"id": "healthcare_agent", "vertical": "healthcare"},
        {"id": "prediction_market_agent", "vertical": "prediction_market"},
        {"id": "trading_agent", "vertical": "trading"},
        {"id": "capital_allocation_agent", "vertical": "capital_allocation"},
    ]

    agent_data = {}

    for a in agents:
        logger.info(f"Registering {a['id']}...")
        # Every OTel span for this agent is tagged with its real DID, not the
        # persona short-name: the oracle's telemetry/trace endpoints and the
        # frontend key exclusively by DID (GET /v1/agents,
        # /v1/agent/{did}/telemetry).
        agent_did, keypair, _ = load_or_create_did(a["id"])
        with _tracer_for(agent_did).start_as_current_span("register_offchain"):
            try:
                reg = register_offchain(ORACLE_URL, agent_did, keypair)
                agent_data[a["id"]] = {"registration": reg, "did": agent_did}

                # Real telemetry_events row -- see _submit_telemetry's
                # docstring for why this didn't exist before. No text_output
                # yet at this point (nothing has "said" anything), so
                # entropy/grounding derive to their real, honest neutral
                # defaults (1.0 -- "no evidence of instability", per
                # derive.py's own docstring) rather than a fabricated score;
                # what matters here is a real, signed, oracle-accepted event
                # existing at all for every agent, not just the one that
                # happens to make an LLM call below.
                _submit_telemetry(
                    agent_did,
                    keypair,
                    {"event": "agent_registered", "vertical": a["vertical"], "persona": a["id"]},
                )
            except Exception as e:
                logger.error(f"Failed to register {a['id']}: {e}")

    # The capital-allocation conversation that used to run here (an LLM agent calling
    # A2ACapitalPool through integrity_sdk.markets) was dropped when integrity-core cut the
    # markets contracts and SDK module (docs/EXECUTION_PLAN.md A1). Every persona still
    # registers and submits a signed telemetry event above.

    summary = {
        "agents_attempted": len(agents),
        "agents_registered": sorted(agent_data.keys()),
        "registrations": {
            agent_id: {
                "did": data["did"],
                "verification_tier": data["registration"].verification_tier,
                "outcome": data["registration"].outcome,
            }
            for agent_id, data in agent_data.items()
        },
    }
    return summary


if __name__ == "__main__":
    main()
