import { describe, expect, it } from 'vitest';
import { classifyAvailability, describeHandleWriteError, handleStatusColor, handleStatusMessage } from './xnsAvailability';
import type { XnsAvailabilityDto } from './oracle';

const dto = (over: Partial<XnsAvailabilityDto>): XnsAvailabilityDto => ({
  handle: 'atlas', available: false, valid: true, directory_available: true, onchain: 'free', suggestions: [], ...over,
});

describe('classifyAvailability', () => {
  it('available only when the Oracle says so', () => {
    expect(classifyAvailability(dto({ available: true })).status).toBe('available');
    expect(classifyAvailability(dto({ available: true, onchain: 'not_deployed' })).onchainNotDeployed).toBe(true);
  });

  it('unverified is never taken and offers no suggestions', () => {
    const c = classifyAvailability(dto({ onchain: 'unverified', suggestions: ['atlas1'] }));
    expect(c.status).toBe('unverified');
    expect(c.takenBy).toBeNull();
    expect(c.suggestions).toEqual([]);
    expect(handleStatusMessage(c)).toMatch(/can't verify on-chain/i);
    expect(handleStatusMessage(c)).not.toMatch(/taken/i);
    expect(handleStatusColor(c.status)).toBe('var(--warning)');
  });

  it.each([
    [false, 'free', 'directory', /Oracle directory/],
    [true, 'taken', 'onchain', /on-chain/],
    [false, 'taken', 'both', /directory and on-chain/],
  ] as const)('names the namespace holding it (dir=%s onchain=%s)', (dir, onchain, takenBy, msg) => {
    const c = classifyAvailability(dto({ directory_available: dir, onchain, suggestions: ['atlas1'] }));
    expect(c.status).toBe('taken');
    expect(c.takenBy).toBe(takenBy);
    expect(c.suggestions).toEqual(['atlas1']);
    expect(handleStatusMessage(c)).toMatch(msg);
  });

  it('malformed handle is invalid', () => {
    expect(classifyAvailability(dto({ valid: false, directory_available: null, onchain: null })).status).toBe('invalid');
  });

  it('older Oracle without namespace fields: not available stays taken, never free', () => {
    const c = classifyAvailability({ handle: 'atlas', available: false, suggestions: ['atlas2'] });
    expect(c.status).toBe('taken');
    expect(c.takenBy).toBeNull();
    expect(c.suggestions).toEqual(['atlas2']);
  });
});

describe('describeHandleWriteError', () => {
  it('503 is retryable and says nothing was claimed', () => {
    const r = describeHandleWriteError({ status: 503, message: 'service unavailable' });
    expect(r.retryable).toBe(true);
    expect(r.message).toMatch(/nothing was claimed/);
  });
  it('409 from an on-chain holder says so', () => {
    const r = describeHandleWriteError({ status: 409, message: 'xns handle unavailable: atlas (held on-chain in XibalbaNameService)' });
    expect(r.retryable).toBe(false);
    expect(r.message).toMatch(/held on-chain/);
  });
  it('plain 409 is a directory conflict', () => {
    expect(describeHandleWriteError({ status: 409, message: 'xns handle unavailable: atlas' }).message).toMatch(/just claimed/);
  });
});
