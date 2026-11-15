import { useEffect, useState } from 'react';
import { oracle, type XnsAvailabilityDto } from './oracle';

// A handle lives in two namespaces: the Oracle directory (xns_handles) and the on-chain
// XibalbaNameService. The Oracle's GET /v1/xns/available checks both; this module turns its
// answer into one UI state shared by every place a handle is chosen. `unverified` means the
// on-chain read could not be made -- "can't confirm right now", never "taken" or "free".

export type HandleStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'unverified' | 'error';
export type TakenBy = 'directory' | 'onchain' | 'both' | null;

export interface HandleCheck {
  status: HandleStatus;
  takenBy: TakenBy;
  suggestions: string[];
  /** On-chain XNS is not deployed: the directory is the only namespace. */
  onchainNotDeployed: boolean;
}

export const IDLE_CHECK: HandleCheck = { status: 'idle', takenBy: null, suggestions: [], onchainNotDeployed: false };

/** Classifies an availability answer. Older Oracles omit `valid`/`directory_available`/
 * `onchain`; missing fields are unknown, so only `available: true` ever means free. */
export function classifyAvailability(dto: XnsAvailabilityDto): HandleCheck {
  const suggestions = dto.suggestions ?? [];
  if (dto.available) {
    return { status: 'available', takenBy: null, suggestions: [], onchainNotDeployed: dto.onchain === 'not_deployed' };
  }
  if (dto.valid === false) return { status: 'invalid', takenBy: null, suggestions: [], onchainNotDeployed: false };
  if (dto.onchain === 'unverified') return { status: 'unverified', takenBy: null, suggestions: [], onchainNotDeployed: false };
  const directory = dto.directory_available === false;
  const onchain = dto.onchain === 'taken';
  const takenBy: TakenBy = directory && onchain ? 'both' : directory ? 'directory' : onchain ? 'onchain' : null;
  return { status: 'taken', takenBy, suggestions, onchainNotDeployed: false };
}

const WHERE: Record<Exclude<TakenBy, null>, string> = {
  directory: 'in the Oracle directory',
  onchain: 'on-chain (XibalbaNameService)',
  both: 'in the Oracle directory and on-chain',
};

export function handleStatusMessage(check: HandleCheck): string {
  switch (check.status) {
    case 'checking': return 'Checking availability…';
    case 'available': return check.onchainNotDeployed
      ? 'Available -- this agent will be identified by this handle everywhere (on-chain XNS not deployed on this network).'
      : 'Available in the Oracle directory and on-chain -- this agent will be identified by this handle everywhere.';
    case 'taken': return check.takenBy
      ? `Taken ${WHERE[check.takenBy]}. Pick another, or a suggestion below.`
      : 'Taken. Pick another, or a suggestion below.';
    case 'invalid': return '3-32 chars, lowercase letters/digits/./-/_, starting with a letter.';
    case 'unverified': return "Can't verify on-chain right now -- try again shortly.";
    case 'error': return 'Could not reach the Oracle to check this handle. Try again shortly.';
    default: return 'Unique across the whole ecosystem, like a chat-app username.';
  }
}

/** Color token for the status line; existing Industry tokens only. */
export function handleStatusColor(status: HandleStatus): string {
  if (status === 'available') return 'var(--success)';
  if (status === 'taken' || status === 'invalid') return 'var(--danger)';
  if (status === 'unverified' || status === 'error') return 'var(--warning)';
  return 'var(--text-muted)';
}

/** Explains a failed claim/registration. 503 = on-chain XNS could not be checked (the Oracle
 * fails closed): retryable, not a rejection. 409 = held elsewhere. */
export function describeHandleWriteError(err: unknown): { message: string; retryable: boolean } {
  const status = (err as { status?: number } | null)?.status;
  const detail = String((err as { message?: string } | null)?.message ?? '');
  if (status === 503) {
    return { message: "Couldn't verify the handle on-chain right now, so nothing was claimed. Try again shortly.", retryable: true };
  }
  if (status === 409) {
    const onchain = /on-chain/i.test(detail);
    return {
      message: onchain
        ? 'That handle is held on-chain by another agent. Pick another.'
        : 'That handle was just claimed, or this agent already holds a different one. Pick another.',
      retryable: false,
    };
  }
  return { message: detail || 'Request failed. Try again shortly.', retryable: true };
}

/** Debounced live availability check for a handle input. */
export function useHandleAvailability(handle: string, delayMs = 350): HandleCheck {
  const [check, setCheck] = useState<HandleCheck>(IDLE_CHECK);
  useEffect(() => {
    const h = handle.trim().toLowerCase();
    if (!h) { setCheck(IDLE_CHECK); return; }
    let cancelled = false;
    setCheck({ ...IDLE_CHECK, status: 'checking' });
    const t = setTimeout(async () => {
      try {
        const res = await oracle.xnsAvailable(h);
        if (!cancelled) setCheck(classifyAvailability(res));
      } catch {
        // A network/server failure is not a malformed handle.
        if (!cancelled) setCheck({ ...IDLE_CHECK, status: 'error' });
      }
    }, delayMs);
    return () => { cancelled = true; clearTimeout(t); };
  }, [handle, delayMs]);
  return check;
}
