// Registration v3 (Phase 4 PR 4.5): the console's client for the Oracle's off-chain
// registration and on-chain attestation/sync routes. It replaces the legacy v2
// registration route (the factory flow), which 4.6 deletes from the Oracle.
//
//   1. Identity: an Ed25519 key, generated in the browser or imported from an SDK
//      `private_key.pem`. The DID is `did:integrity:` + sha256(raw 32-byte pubkey), the
//      same fingerprint `AgentRegistry` and the Oracle derive. The key never leaves the page.
//   2. Off-chain (gasless): sign the RFC 8785 canonical JSON of
//      {did, domain, ed25519_pubkey_hex, timestamp} and POST /v1/agent/register/offchain.
//   3. On-chain (optional, needs an `AgentRegistry` deployment): sign the EIP-712
//      `RegisterAgent` digest with the agent key, get the Oracle's attestation over the same
//      digest, send one `AgentRegistry.register` from the guardian wallet, then
//      POST /v1/agent/{id}/onchain/sync. The chain is the source of truth for the sync.
//
// Mirrors integrity-core's `offchain_registration.rs` and `onchain_registration.rs`; the
// tests pin the same golden vectors those modules pin.
import { ethers } from 'ethers';
import { oracle, type OnchainAttestationResponse } from './oracle';

export const OFFCHAIN_DOMAIN = 'integrity.agent.register.offchain.v1';
export const DID_PREFIX = 'did:integrity:';
/** `EIP712("IntegrityAgentRegistry", "1")` in AgentRegistry's constructor. */
export const REGISTRY_EIP712_NAME = 'IntegrityAgentRegistry';
export const REGISTRY_EIP712_VERSION = '1';
/** Mirrors `AgentRegistry.REGISTER_AGENT_TYPEHASH`. */
export const REGISTER_AGENT_TYPES = {
    RegisterAgent: [
        { name: 'pubkey', type: 'bytes32' },
        { name: 'guardian', type: 'address' },
        { name: 'actor', type: 'address' },
        { name: 'domainId', type: 'bytes32' },
        { name: 'uriHash', type: 'bytes32' },
        { name: 'deadline', type: 'uint256' },
    ],
};
/** 1 = Oracle attestation (`AgentRegistry` proof kind). */
export const PROOF_KIND_ORACLE = 1;
export const AGENT_REGISTRY_REGISTER_ABI = [
    'function register(bytes32 pubkey, address guardian, address actor, bytes32 domainId, string uri, uint256 deadline, uint8 proofKind, bytes proof, bytes actorConsent) returns (bytes32 fingerprint)',
] as const;

export interface AgentKey {
    did: string;
    /** 64 lowercase hex chars, no `0x`. */
    pubkeyHex: string;
    privateKey: CryptoKey;
}

const ED25519 = { name: 'Ed25519' } as const;

/** A copy backed by a plain ArrayBuffer (WebCrypto's BufferSource excludes SharedArrayBuffer views). */
function buf(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
    return new Uint8Array(bytes);
}

function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
    return Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

function base64UrlToBytes(s: string): Uint8Array {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/** `did:integrity:` + sha256 of the raw 32-byte Ed25519 public key. */
export async function didForPubkey(pubkey: Uint8Array): Promise<string> {
    if (pubkey.length !== 32) throw new Error(`Ed25519 public key must be 32 bytes, got ${pubkey.length}`);
    return DID_PREFIX + bytesToHex(await crypto.subtle.digest('SHA-256', buf(pubkey)));
}

async function keyFromPrivate(privateKey: CryptoKey): Promise<AgentKey> {
    // The JWK form of an OKP private key carries its public half in `x`, so the public key
    // never has to be stored or typed separately.
    const jwk = await crypto.subtle.exportKey('jwk', privateKey);
    if (jwk.kty !== 'OKP' || jwk.crv !== 'Ed25519' || !jwk.x) throw new Error('Not an Ed25519 private key');
    const pubkey = base64UrlToBytes(jwk.x);
    return { did: await didForPubkey(pubkey), pubkeyHex: bytesToHex(pubkey), privateKey };
}

/** A fresh, extractable Ed25519 agent key (extractable so the operator can save it). */
export async function generateAgentKey(): Promise<AgentKey> {
    const pair = (await crypto.subtle.generateKey(ED25519, true, ['sign', 'verify'])) as CryptoKeyPair;
    return keyFromPrivate(pair.privateKey);
}

/** PKCS#8 PEM, the format integrity-sdk stores as `<agent>/private_key.pem`. */
export async function exportPrivateKeyPem(key: AgentKey): Promise<string> {
    const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', key.privateKey));
    const b64 = btoa(String.fromCharCode(...der));
    return `-----BEGIN PRIVATE KEY-----\n${b64.match(/.{1,64}/g)!.join('\n')}\n-----END PRIVATE KEY-----\n`;
}

/** Imports an SDK `private_key.pem` (unencrypted PKCS#8 Ed25519). */
export async function importPrivateKeyPem(pem: string): Promise<AgentKey> {
    const m = pem.match(/-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/);
    if (!m) throw new Error('Expected an unencrypted PKCS#8 PEM ("BEGIN PRIVATE KEY")');
    const der = Uint8Array.from(atob(m[1].replace(/\s+/g, '')), (c) => c.charCodeAt(0));
    const privateKey = await crypto.subtle.importKey('pkcs8', der, ED25519, true, ['sign']);
    return keyFromPrivate(privateKey);
}

async function signHex(key: AgentKey, message: Uint8Array): Promise<string> {
    return bytesToHex(await crypto.subtle.sign(ED25519, key.privateKey, buf(message)));
}

/**
 * The exact bytes the off-chain proof signs: RFC 8785 canonical JSON. All four values are
 * ASCII and the keys are already in code-point order, so JSON.stringify of this literal is
 * the canonical form (pinned against the Rust golden vector in the tests).
 */
export function offchainSigningMessage(did: string, pubkeyHex: string, timestamp: number): string {
    return JSON.stringify({
        did,
        domain: OFFCHAIN_DOMAIN,
        ed25519_pubkey_hex: pubkeyHex.replace(/^0x/, '').toLowerCase(),
        timestamp,
    });
}

/** POST /v1/agent/register/offchain. Idempotent server-side (200 when already registered). */
export async function registerOffchain(
    key: AgentKey,
    opts: { handle?: string; nowSeconds?: number } = {},
) {
    const timestamp = opts.nowSeconds ?? Math.floor(Date.now() / 1000);
    const signature = await signHex(key, new TextEncoder().encode(offchainSigningMessage(key.did, key.pubkeyHex, timestamp)));
    const handle = opts.handle?.trim();
    return oracle.registerOffchain({
        did: key.did,
        ed25519_pubkey_hex: key.pubkeyHex,
        timestamp,
        signature,
        did_document: null,
        ...(handle ? { handle } : {}),
    });
}

export interface RegisterFields {
    pubkey: string;
    guardian: string;
    actor: string;
    domainId: string;
    uri: string;
    deadline: bigint | number;
}

/** `AgentRegistry.registerDigest(...)`, computed locally (no RPC). */
export function registerDigest(chainId: number | bigint, registry: string, f: RegisterFields): string {
    return ethers.TypedDataEncoder.hash(
        { name: REGISTRY_EIP712_NAME, version: REGISTRY_EIP712_VERSION, chainId, verifyingContract: registry },
        REGISTER_AGENT_TYPES,
        {
            pubkey: f.pubkey,
            guardian: f.guardian,
            actor: f.actor,
            domainId: f.domainId,
            uriHash: ethers.keccak256(ethers.toUtf8Bytes(f.uri)),
            deadline: f.deadline,
        },
    );
}

/**
 * Signs the existence-only `RegisterAgent` digest (no actor, no domain, empty URI) with the
 * agent key and asks the Oracle to attest it. The response is checked against what this
 * page computed, so a misconfigured registry/chain fails here, before any gas is spent.
 */
export async function requestAttestation(
    key: AgentKey,
    params: { chainId: number; registry: string; guardian: string; deadline: number },
): Promise<OnchainAttestationResponse> {
    const fields: RegisterFields = {
        pubkey: `0x${key.pubkeyHex}`,
        guardian: params.guardian,
        actor: ethers.ZeroAddress,
        domainId: ethers.ZeroHash,
        uri: '',
        deadline: params.deadline,
    };
    const digest = registerDigest(params.chainId, params.registry, fields);
    const signature = await signHex(key, ethers.getBytes(digest));
    const att = await oracle.onchainAttestation(key.did, {
        guardian: params.guardian,
        uri: '',
        deadline: params.deadline,
        signature,
    });
    const mismatches = [
        att.digest.toLowerCase() !== digest.toLowerCase() && 'digest',
        Number(att.chain_id) !== Number(params.chainId) && 'chain_id',
        att.agent_registry.toLowerCase() !== params.registry.toLowerCase() && 'agent_registry',
        att.pubkey.replace(/^0x/, '').toLowerCase() !== key.pubkeyHex && 'pubkey',
    ].filter(Boolean);
    if (mismatches.length) {
        throw new Error(`Oracle attestation does not match this console's configuration (${mismatches.join(', ')}); not sending a transaction.`);
    }
    return att;
}

/** The argument list for `AgentRegistry.register`, straight from the checked attestation. */
export function registerArgs(att: OnchainAttestationResponse) {
    return [att.pubkey, att.guardian, att.actor, att.domain_id, att.uri, att.deadline, att.proof_kind, att.attestation, '0x'] as const;
}
