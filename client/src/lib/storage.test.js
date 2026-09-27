import { afterEach, describe, expect, it, vi } from 'vitest';
import { readJSON, writeJSON } from './storage.js';

afterEach(() => vi.unstubAllGlobals());

describe('storage', () => {
  it('returns the fallback when localStorage is missing or throws', () => {
    expect(readJSON('k', 'fallback')).toBe('fallback');
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } });
    expect(readJSON('k', [])).toEqual([]);
    expect(() => writeJSON('k', [1])).not.toThrow();
  });
  it('round-trips raw strings for the caller to parse', () => {
    const data = {};
    vi.stubGlobal('localStorage', { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } });
    writeJSON('k', [{ productId: 1, quantity: 2 }]);
    expect(readJSON('k', null)).toBe('[{"productId":1,"quantity":2}]');
  });
});
