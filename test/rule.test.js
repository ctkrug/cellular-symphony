import { describe, expect, it } from 'vitest';
import {
  bitsFromRule,
  clampRule,
  getBit,
  ruleFromBits,
  setBit,
  toggleBit,
} from '../src/lib/rule.js';

describe('clampRule', () => {
  it('leaves in-range values untouched', () => {
    expect(clampRule(30)).toBe(30);
    expect(clampRule(0)).toBe(0);
    expect(clampRule(255)).toBe(255);
  });

  it('clamps below 0 and above 255', () => {
    expect(clampRule(-5)).toBe(0);
    expect(clampRule(999)).toBe(255);
  });

  it('truncates fractional input and guards NaN', () => {
    expect(clampRule(30.9)).toBe(30);
    expect(clampRule(NaN)).toBe(0);
  });
});

describe('getBit', () => {
  it('reads each bit of rule 30 (00011110)', () => {
    expect(bitsFromRule(30)).toEqual([0, 1, 1, 1, 1, 0, 0, 0]);
  });

  it('reads rule 0 as all-zero and rule 255 as all-one', () => {
    expect(bitsFromRule(0)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(bitsFromRule(255)).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
  });
});

describe('setBit / toggleBit', () => {
  it('sets a bit on and off without disturbing others', () => {
    expect(setBit(0, 3, 1)).toBe(0b00001000);
    expect(setBit(0b00001000, 3, 0)).toBe(0);
  });

  it('toggleBit flips exactly the targeted neighborhood', () => {
    const rule = 30;
    const toggled = toggleBit(rule, 0);
    expect(getBit(toggled, 0)).toBe(1);
    bitsFromRule(rule).forEach((bit, i) => {
      if (i !== 0) expect(getBit(toggled, i)).toBe(bit);
    });
  });

  it('toggling twice returns to the original rule', () => {
    expect(toggleBit(toggleBit(90, 5), 5)).toBe(90);
  });
});

describe('ruleFromBits / bitsFromRule round trip', () => {
  it('round-trips every rule 0-255', () => {
    for (let rule = 0; rule <= 255; rule += 1) {
      expect(ruleFromBits(bitsFromRule(rule))).toBe(rule);
    }
  });
});
