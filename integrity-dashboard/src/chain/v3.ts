import { ethers } from 'ethers';
import deployments from '../deployments.baseSepolia.json';
import { AGENT_REGISTRY_ADDRESS } from '../constants';
import type { AgentResponse } from '../services/oracle';

// Registration v3 reads (v2-graph deletion slice C1). The console no longer resolves an agent
// through the Oracle's v2 per-agent contract set: the agent's on-chain identity is its `AgentRegistry`
// record (the Oracle mirrors it as `onchain`, PR 4.3), and every shared contract is a singleton
// in the deployments file. Until the owner's Base Sepolia broadcast mirrors `AgentRegistry` /
// `ActionAnchor` into src/deployments.baseSepolia.json, their addresses are undefined and every
// read here reports "not deployed" instead of guessing.

const S = deployments.singletons as Record<string, string | undefined>;

/** v3 Merkle-root anchor, one singleton keyed by actor (replaces the v2 per-agent clone). */
export const ACTION_ANCHOR_ADDRESS: string | undefined = S.ActionAnchor;

export const AGENT_REGISTRY_ABI = [
  'function trustConfig() view returns (address)',
  'function fingerprintOfDID(string did) pure returns (bytes32)',
  'function setUri(bytes32 fingerprint, string uri)',
] as const;
export const TRUST_CONFIG_ABI = ['function stakeVault() view returns (address)'] as const;
// `disputeLockedOf(actor) > 0` is exactly the signal bcc_middleware/app/quarantine.py gates on
// (deliberately not `stakeOf(actor).locked`, which covers per-action locks only).
export const STAKE_VAULT_READ_ABI = ['function disputeLockedOf(address) view returns (uint256)'] as const;
export const ACTION_ANCHOR_READ_ABI = ['function latestRoot(address) view returns (bytes32)'] as const;

const isZero = (a: string) => /^0x0+$/i.test(a);

/**
 * The agent's bound actor (its `SovereignAgent`) from the synced `AgentRegistry` record, or null
 * for an off-chain agent, an existence-only record, or a retired one.
 */
export function actorOf(detail: Pick<AgentResponse, 'onchain'> | null | undefined): string | null {
  const rec = detail?.onchain;
  if (!rec || !rec.active || rec.retired_at != null) return null;
  const a = rec.actor;
  return a && ethers.isAddress(a) && !isZero(a) ? a : null;
}

/** Contract rows an agent controls on-chain, from its v3 record (empty for an off-chain agent). */
export function onchainContractRows(detail: Pick<AgentResponse, 'onchain'> | null | undefined): [string, string][] {
  const rec = detail?.onchain;
  if (!rec) return [];
  const rows: [string, string][] = [['agent_registry_record', rec.agent_registry]];
  const actor = actorOf(detail);
  if (actor) rows.push(['sovereign_agent', actor]);
  return rows;
}

export class NotDeployedError extends Error {
  constructor(name: string) {
    super(`${name} is not deployed on this network yet (no address in the deployments mirror).`);
    this.name = 'NotDeployedError';
  }
}

/** `AgentRegistry.trustConfig()` -> `TrustConfig.stakeVault()`, the same resolution D2's BCC uses. */
export async function resolveStakeVault(provider: ethers.Provider, registry = AGENT_REGISTRY_ADDRESS): Promise<string> {
  if (!registry) throw new NotDeployedError('AgentRegistry');
  const cfg: string = await new ethers.Contract(registry, AGENT_REGISTRY_ABI, provider).trustConfig();
  if (isZero(cfg)) throw new Error('AgentRegistry.trustConfig() is unset.');
  const vault: string = await new ethers.Contract(cfg, TRUST_CONFIG_ABI, provider).stakeVault();
  if (isZero(vault)) throw new Error('TrustConfig.stakeVault() is unset.');
  return vault;
}

/** `ActionAnchor.latestRoot(actor)`; zero means the actor has never anchored. */
export async function latestActionRoot(provider: ethers.Provider, actor: string, anchor = ACTION_ANCHOR_ADDRESS): Promise<string> {
  if (!anchor) throw new NotDeployedError('ActionAnchor');
  return new ethers.Contract(anchor, ACTION_ANCHOR_READ_ABI, provider).latestRoot(actor);
}
