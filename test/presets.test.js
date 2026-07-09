import { describe, expect, it } from 'vitest';
import { PRESETS } from '../src/lib/presets.js';

describe('PRESETS', () => {
  it('has at least 6 curated presets', () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(6);
  });

  it('every preset has a valid rule number and a non-empty label', () => {
    PRESETS.forEach((preset) => {
      expect(preset.rule).toBeGreaterThanOrEqual(0);
      expect(preset.rule).toBeLessThanOrEqual(255);
      expect(typeof preset.label).toBe('string');
      expect(preset.label.length).toBeGreaterThan(0);
    });
  });

  it('has no duplicate rule numbers', () => {
    const rules = PRESETS.map((p) => p.rule);
    expect(new Set(rules).size).toBe(rules.length);
  });
});
