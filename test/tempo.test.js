import { describe, expect, it } from 'vitest';
import { TEMPO_MAX, TEMPO_MIN, clampTempo, tempoToIntervalMs } from '../src/lib/tempo.js';

describe('clampTempo', () => {
  it('leaves in-range values untouched', () => {
    expect(clampTempo(6)).toBe(6);
  });

  it('clamps below the minimum and above the maximum', () => {
    expect(clampTempo(0)).toBe(TEMPO_MIN);
    expect(clampTempo(-10)).toBe(TEMPO_MIN);
    expect(clampTempo(999)).toBe(TEMPO_MAX);
  });

  it('guards against NaN', () => {
    expect(clampTempo(NaN)).toBe(TEMPO_MIN);
  });
});

describe('tempoToIntervalMs', () => {
  it('converts steps/sec to a millisecond interval', () => {
    expect(tempoToIntervalMs(1)).toBe(1000);
    expect(tempoToIntervalMs(10)).toBe(100);
  });

  it('clamps out-of-range tempos before converting', () => {
    expect(tempoToIntervalMs(999)).toBe(tempoToIntervalMs(TEMPO_MAX));
  });
});
