import { afterEach, describe, expect, it, vi } from 'vitest';
import { ethers } from 'ethers';
import {
    exportPrivateKeyPem,
    generateAgentKey,
    importPrivateKeyPem,
    offchainSigningMessage,
    registerArgs,
    registerDigest,
    registerOffchain,
    requestAttestation,
} from './agentRegistration';
import type { OnchainAttestationResponse } from './oracle';

// Seed [7u8; 32]: the key integrity-core's offchain_registration.rs pins as
// GOLDEN_PUBKEY_SEED7_HEX. The PEM and the signature below were produced independently
// with Python `cryptography` (Ed25519 signatures are deterministic), so these tests check
// the browser path against two other implementations, not against itself.
const SEED7_PEM = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIAcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcH
-----END PRIVATE KEY-----
`;
const SEED7_PUBKEY = 'ea4a6c63e29c520abef5507b132ec5f9954776aebebe7b92421eea691446d22c';
const SEED7_DID = 'did:integrity:fe812c12f3ab4ce6ac5db69ac352f906cb1b11ef43fb33e252ef7ff552263889';
const NOW = 1_800_000_000;
const SEED7_OFFCHAIN_SIG =
    'b9c0e43bddb9c947a11c278f6f4ae1f46b5f869fdf92e6153627ab0394e558f4' +
    '2a391c581672504161179f9b57cac92624854b570e955cc584cddf18e040d602';

type Call = { url: string; init?: RequestInit };

function mockFetch(respond: (url: string, body: any) => unknown, status = 200) {
    const calls: Call[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init });
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        const payload = respond(url, body);
        return new Response(JSON.stringify(payload), { status });
    }));
    return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe('agent key', () => {
    it('imports an SDK private_key.pem and derives the golden pubkey and DID', async () => {
        const key = await importPrivateKeyPem(SEED7_PEM);
        expect(key.pubkeyHex).toBe(SEED7_PUBKEY);
        expect(key.did).toBe(SEED7_DID);
    });

    it('round-trips a generated key through PEM to the same DID', async () => {
        const key = await generateAgentKey();
        expect(key.did).toMatch(/^did:integrity:[0-9a-f]{64}$/);
        const again = await importPrivateKeyPem(await exportPrivateKeyPem(key));
        expect(again.did).toBe(key.did);
        expect(again.pubkeyHex).toBe(key.pubkeyHex);
    });

    it('rejects a PEM that is not an unencrypted PKCS#8 key', async () => {
        await expect(importPrivateKeyPem('-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----')).rejects.toThrow(/PKCS#8/);
    });
});

describe('off-chain registration', () => {
    it('signs the exact canonical bytes integrity-core pins (0x/uppercase pubkey normalized)', () => {
        expect(offchainSigningMessage(SEED7_DID, `0x${SEED7_PUBKEY.toUpperCase()}`, NOW)).toBe(
            `{"did":"${SEED7_DID}","domain":"integrity.agent.register.offchain.v1","ed25519_pubkey_hex":"${SEED7_PUBKEY}","timestamp":1800000000}`,
        );
    });

    it('POSTs /v1/agent/register/offchain with the deterministic Ed25519 proof', async () => {
        const calls = mockFetch(() => ({ agent_id: SEED7_DID, verification_tier: 1, outcome: 'created', handle: 'seven.integrity' }));
        const key = await importPrivateKeyPem(SEED7_PEM);
        const res = await registerOffchain(key, { handle: '  seven.integrity ', nowSeconds: NOW });

        expect(res.outcome).toBe('created');
        expect(calls).toHaveLength(1);
        expect(calls[0].url).toMatch(/\/v1\/agent\/register\/offchain$/);
        expect(calls[0].init?.method).toBe('POST');
        expect(JSON.parse(String(calls[0].init?.body))).toEqual({
            did: SEED7_DID,
            ed25519_pubkey_hex: SEED7_PUBKEY,
            timestamp: NOW,
            signature: SEED7_OFFCHAIN_SIG,
            did_document: null,
            handle: 'seven.integrity',
        });
    });

    it('omits the handle when none is given (the route treats it as optional)', async () => {
        const calls = mockFetch(() => ({ agent_id: SEED7_DID, verification_tier: 1, outcome: 'already_registered', handle: null }));
        await registerOffchain(await importPrivateKeyPem(SEED7_PEM), { handle: '   ', nowSeconds: NOW });
        expect(JSON.parse(String(calls[0].init?.body))).not.toHaveProperty('handle');
    });

    it('surfaces the Oracle refusal (e.g. a stale timestamp) instead of swallowing it', async () => {
        mockFetch(() => ({ error: 'timestamp outside the accepted window' }), 401);
        await expect(registerOffchain(await importPrivateKeyPem(SEED7_PEM), { nowSeconds: NOW })).rejects.toThrow(/timestamp outside/);
    });
});

describe('on-chain attestation', () => {
    it('computes AgentRegistry.registerDigest identically to integrity-core\'s independent EIP-712 vector', () => {
        const digest = registerDigest(31337, '0x5FbDB2315678afecb367f032d93F642f64180aa3', {
            pubkey: `0x${'11'.repeat(32)}`,
            guardian: `0x${'22'.repeat(20)}`,
            actor: `0x${'33'.repeat(20)}`,
            domainId: `0x${'44'.repeat(32)}`,
            uri: 'ipfs://x',
            deadline: 1_700_000_000,
        });
        expect(digest).toBe('0x0bbab02f7088d62ff5d3fe5df3b43061122f0e797f6b1b971498a62fdffcfa69');
    });

    const REGISTRY = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    const GUARDIAN = '0x2222222222222222222222222222222222222222';
    const DEADLINE = 1_800_003_600;

    function attestationFor(digest: string, overrides: Partial<OnchainAttestationResponse> = {}): OnchainAttestationResponse {
        return {
            agent_id: SEED7_DID, digest, attestation: `0x${'ab'.repeat(65)}`, attester: GUARDIAN, proof_kind: 1,
            chain_id: 84532, agent_registry: REGISTRY.toLowerCase(), pubkey: `0x${SEED7_PUBKEY}`, guardian: GUARDIAN.toLowerCase(),
            actor: ethers.ZeroAddress, domain_id: ethers.ZeroHash, uri: '', deadline: DEADLINE, ...overrides,
        };
    }

    it('signs the existence-only digest with the agent key and accepts a matching attestation', async () => {
        const key = await importPrivateKeyPem(SEED7_PEM);
        const expected = registerDigest(84532, REGISTRY, {
            pubkey: `0x${SEED7_PUBKEY}`, guardian: GUARDIAN, actor: ethers.ZeroAddress, domainId: ethers.ZeroHash, uri: '', deadline: DEADLINE,
        });
        const calls = mockFetch(() => attestationFor(expected));

        const att = await requestAttestation(key, { chainId: 84532, registry: REGISTRY, guardian: GUARDIAN, deadline: DEADLINE });

        expect(calls[0].url).toMatch(new RegExp(`/v1/agent/${encodeURIComponent(SEED7_DID)}/onchain/attestation$`));
        const sent = JSON.parse(String(calls[0].init?.body));
        expect(sent).toMatchObject({ guardian: GUARDIAN, uri: '', deadline: DEADLINE });
        expect(sent).not.toHaveProperty('actor');
        // The Oracle verifies this signature against the registered key over the raw digest.
        const b = (hex: string) => new Uint8Array(ethers.getBytes(hex.startsWith('0x') ? hex : `0x${hex}`));
        const pub = await crypto.subtle.importKey('raw', b(SEED7_PUBKEY), { name: 'Ed25519' }, false, ['verify']);
        expect(await crypto.subtle.verify({ name: 'Ed25519' }, pub, b(sent.signature), b(expected))).toBe(true);
        expect(registerArgs(att)).toEqual([
            `0x${SEED7_PUBKEY}`, GUARDIAN.toLowerCase(), ethers.ZeroAddress, ethers.ZeroHash, '', DEADLINE, 1, `0x${'ab'.repeat(65)}`, '0x',
        ]);
    });

    it.each([
        ['agent_registry', { agent_registry: '0x000000000000000000000000000000000000dEaD' }],
        ['chain_id', { chain_id: 1 }],
        ['digest', { digest: ethers.ZeroHash }],
    ])('refuses an attestation whose %s differs from this console (no transaction)', async (field, override) => {
        const key = await importPrivateKeyPem(SEED7_PEM);
        const expected = registerDigest(84532, REGISTRY, {
            pubkey: `0x${SEED7_PUBKEY}`, guardian: GUARDIAN, actor: ethers.ZeroAddress, domainId: ethers.ZeroHash, uri: '', deadline: DEADLINE,
        });
        mockFetch(() => attestationFor(expected, override));
        await expect(requestAttestation(key, { chainId: 84532, registry: REGISTRY, guardian: GUARDIAN, deadline: DEADLINE }))
            .rejects.toThrow(new RegExp(field));
    });
});
