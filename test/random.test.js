import { describe, expect, it, vi } from 'vitest';
import { createRng, randomRule, randomSeed, seedRowFromSeed } from '../src/lib/random.js';

describe('createRng', () => {
  it('is deterministic: same seed produces the same sequence', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('different seeds produce different sequences', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a()).not.toBe(b());
  });

  it('always returns floats in [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 100; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('seedRowFromSeed', () => {
  it('is deterministic for a given seed and width', () => {
    expect(seedRowFromSeed(20, 123)).toEqual(seedRowFromSeed(20, 123));
  });

  it('produces the requested width of only 0/1 values', () => {
    const row = seedRowFromSeed(15, 5);
    expect(row).toHaveLength(15);
    row.forEach((cell) => expect([0, 1]).toContain(cell));
  });

  it('handles width 0', () => {
    expect(seedRowFromSeed(0, 1)).toEqual([]);
  });

  it('different seeds are very likely to produce different rows', () => {
    expect(seedRowFromSeed(32, 1)).not.toEqual(seedRowFromSeed(32, 2));
  });
});

describe('randomSeed / randomRule', () => {
  it('randomSeed returns an unsigned 32-bit integer', () => {
    const seed = randomSeed();
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(0xffffffff);
  });

  it('randomRule returns an integer in 0-255', () => {
    const rule = randomRule();
    expect(Number.isInteger(rule)).toBe(true);
    expect(rule).toBeGreaterThanOrEqual(0);
    expect(rule).toBeLessThanOrEqual(255);
  });

  it('draws from Math.random rather than a fixed sequence', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    expect(randomRule()).toBe(255);
    spy.mockRestore();
  });
});
