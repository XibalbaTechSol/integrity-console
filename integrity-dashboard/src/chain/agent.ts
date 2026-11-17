import { ethers } from 'ethers';
import { SOVEREIGN_AGENT_ABI } from './bytecode';

// Minimal ABIs and the agent calling convention shared by the kept pages (Health, Privacy,
// Token wallet). Moved here from chain/markets.ts when the markets contracts were cut from
// the protocol (integrity-core docs/EXECUTION_PLAN.md A1). Kept minimal: only what the
// dashboard calls, reads or parses.

export const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
] as const;

/**
 * Route a call through the agent's own SovereignAgent.execute: the protocol's calling
 * convention for every registered-agent-gated contract (SmartBAA.sign,
 * EHRGate.verifyAndLogAccess, ...). `msg.sender` inside the target is then the SovereignAgent,
 * the actor AgentRegistry binds to the agent's DID. The connected signer
 * MUST be the agent's controller (SovereignAgent.execute is onlyController) or the transaction
 * reverts with NotController.
 */
export async function executeAsAgent(
  signer: ethers.Signer,
  sovereignAgent: string,
  target: string,
  data: string,
  value: bigint = 0n,
): Promise<ethers.TransactionReceipt> {
  const sa = new ethers.Contract(sovereignAgent, SOVEREIGN_AGENT_ABI, signer);
  const tx = await sa.execute(target, value, data);
  return tx.wait();
}
