// On-chain addresses are sourced from the committed mirror of the repo-root
// deployments.baseSepolia.json (src/deployments.baseSepolia.json) — NOT hand-copied
// here, which is how the previous values went stale (they were legacy addresses from
// the old INTEGRITY repo and pointed at the wrong/nonexistent contracts on this
// network). Per-agent addresses (the bound actor) are never hardcoded; they come from the
// agent's AgentRegistry record via oracle.getAgent().onchain (see chain/v3.ts).
import deployments from './deployments.baseSepolia.json';

const S = deployments.singletons;

// The real deployed IntegrityToken ($ITK) on Base Sepolia.
export const ITK_TOKEN_ADDRESS = S.IntegrityToken;
// Domain membership: AgentRegistry.setDomain / bindActor require canJoin(domainId, guardian).
export const DOMAIN_REGISTRY_ADDRESS = S.DomainRegistry;
export const SMART_BAA_FACTORY_ADDRESS = S.SmartBAAFactory;
export const COVERED_ENTITY_REGISTRY_ADDRESS = S.CoveredEntityRegistry;
export const XNS_ADDRESS = (S as Record<string, string>).XibalbaNameService;
// undefined until DeployEHRGate.s.sol runs against Base Sepolia (only ever run
// locally so far — see PRODUCTION_GAPS.md). Consumers must check for this before use.
export const EHR_GATE_ADDRESS = (S as Record<string, string>).EHRGate;
// Registration v3 AgentRegistry. undefined until its Base Sepolia broadcast is mirrored
// here; RegisterAgentModal keeps the on-chain step disabled until then (the Oracle's
// /onchain/sync also answers 503 without it). Consumers must check for this before use.
export const AGENT_REGISTRY_ADDRESS: string | undefined = (S as Record<string, string>).AgentRegistry;

// Protocol-held Oracle signer (its attestations back AgentRegistry proofKind 1).
// Single-operator testnet setup.
export const ORACLE_SIGNER_ADDRESS = deployments.protocolAddresses.oracleSigner;
// Neutral SmartBAA arbitrator (single-operator testnet; == the other protocol roles).
export const ARBITRATOR_ADDRESS = deployments.protocolAddresses.arbitrator;
// domainId (bytes32) an agent's actor is bound under. Both are Open-join
// on Base Sepolia (DomainRegistry.JoinMode.Open) — any wallet can self-register.
export const DOMAINS = deployments.domains;

export const BASE_SEPOLIA_CHAIN_ID = deployments.chainId;
export const RPC_URL = deployments.rpcUrl;
export const EXPLORER_URL = deployments.explorerUrl;

// The real, on-chain registered agent used to attribute every dashboard-triggered test
// action (Guided System Test wizard) -- NOT XIBALBA_AGENT_ADDRESS above (that's the
// AgentRegistry contract's own address, a different thing). Confirmed live via the
// Oracle's own GET /v1/agents: handle "xibalba.integrity", registered 2026-08-12. Every
// system's test-event log (Oracle audit_log, Cortex otel_events, Shield test_events) is
// tagged with this same DID so a test run is queryable by the same identity everywhere.
export const XIBALBA_TEST_AGENT_ID = 'did:integrity:68fed1331613937555a59398223e8e87520a87dd0305aac4fd7ecdc32a14a861';

export const LICENCE_REFERENCE = (
  deployments as unknown as {
    experimentalPhase2LicenceReference?: {
      LicenceAccountImplementation: string;
      LicenceToken: string;
      deployedFromCommit: string;
      disclosure: string;
      licenceEndTime: number;
      licenceStartTime: number;
      owner: string;
      protocolFeeBps: number;
      protocolFeeRecipient: string;
      royaltyPricePerUnitWei: number;
      salt: string;
      tokenBoundAccount: string;
      tokenId: number;
      volumeCapTotal: number;
    };
  }
).experimentalPhase2LicenceReference;
