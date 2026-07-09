import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { parseState, serializeState } from '../src/lib/urlState.js';
import { NOTE_NAMES, SCALE_NAMES } from '../src/lib/scale.js';
import { TEMPO_MAX, TEMPO_MIN } from '../src/lib/tempo.js';

describe('serializeState', () => {
  it('encodes all five fields in a fixed order', () => {
    const query = serializeState({ rule: 90, seed: 12345, scale: 'pentatonic', root: 'A', tempo: 6 });
    expect(query).toBe('rule=90&seed=12345&scale=pentatonic&root=A&tempo=6');
  });

  it('is stable: equal states produce byte-identical strings', () => {
    const a = serializeState({ rule: 30, seed: 7, scale: 'minor', root: 'D', tempo: 3 });
    const b = serializeState({ rule: 30, seed: 7, scale: 'minor', root: 'D', tempo: 3 });
    expect(a).toBe(b);
  });

  it('clamps an out-of-range rule and tempo before encoding', () => {
    const query = serializeState({ rule: 999, seed: 1, scale: 'major', root: 'C', tempo: 99 });
    expect(query).toContain('rule=255');
    expect(query).toContain('tempo=12');
  });

  it('coerces the seed to an unsigned 32-bit integer', () => {
    const query = serializeState({ rule: 1, seed: -1, scale: 'major', root: 'C', tempo: 4 });
    expect(query).toContain(`seed=${0xffffffff}`);
  });
});

describe('parseState', () => {
  it('parses a full, valid query into every field', () => {
    const state = parseState('?rule=90&seed=12345&scale=pentatonic&root=A&tempo=6');
    expect(state).toEqual({ rule: 90, seed: 12345, scale: 'pentatonic', root: 'A', tempo: 6 });
  });

  it('tolerates a missing leading question mark', () => {
    expect(parseState('rule=110')).toEqual({ rule: 110 });
  });

  it('accepts a URLSearchParams directly', () => {
    const params = new URLSearchParams('rule=60&root=E');
    expect(parseState(params)).toEqual({ rule: 60, root: 'E' });
  });

  it('returns an empty object for an empty or junk query', () => {
    expect(parseState('')).toEqual({});
    expect(parseState('?')).toEqual({});
    expect(parseState('foo=bar&baz=qux')).toEqual({});
  });

  it('ignores unknown parameters but keeps known ones', () => {
    expect(parseState('rule=45&nonsense=1&color=red')).toEqual({ rule: 45 });
  });

  it('includes only the fields that were present', () => {
    expect(parseState('scale=minor&tempo=8')).toEqual({ scale: 'minor', tempo: 8 });
  });

  describe('adversarial rule values', () => {
    it.each([
      ['rule=-5', 'negative'],
      ['rule=256', 'above max'],
      ['rule=1000', 'far above max'],
      ['rule=3.5', 'float'],
      ['rule=0x1f', 'hex'],
      ['rule=abc', 'non-numeric'],
      ['rule=', 'empty'],
      ['rule=%20%20', 'whitespace only'],
      ['rule=NaN', 'literal NaN'],
      ['rule=1e3', 'scientific notation'],
      ['rule=😀', 'emoji'],
    ])('drops an invalid rule (%s — %s)', (query) => {
      expect(parseState(query).rule).toBeUndefined();
    });

    it('keeps boundary rule values 0 and 255', () => {
      expect(parseState('rule=0').rule).toBe(0);
      expect(parseState('rule=255').rule).toBe(255);
    });
  });

  describe('adversarial seed values', () => {
    it('keeps a valid unsigned 32-bit seed', () => {
      expect(parseState(`seed=${0xffffffff}`).seed).toBe(0xffffffff);
    });

    it.each([
      ['seed=-1', 'negative'],
      [`seed=${0xffffffff + 1}`, 'above uint32'],
      ['seed=1.5', 'float'],
      ['seed=deadbeef', 'hex-ish string'],
      ['seed=', 'empty'],
    ])('drops an invalid seed (%s — %s)', (query) => {
      expect(parseState(query).seed).toBeUndefined();
    });

    it('keeps a seed of 0', () => {
      expect(parseState('seed=0').seed).toBe(0);
    });
  });

  describe('adversarial scale/root values', () => {
    it('drops an unknown scale', () => {
      expect(parseState('scale=lydian').scale).toBeUndefined();
      expect(parseState('scale=MAJOR').scale).toBeUndefined();
    });

    it('drops an unknown root note', () => {
      expect(parseState('root=H').root).toBeUndefined();
      expect(parseState('root=c').root).toBeUndefined();
    });
  });

  describe('adversarial tempo values', () => {
    it('clamps a tempo below the minimum', () => {
      expect(parseState('tempo=0').tempo).toBe(TEMPO_MIN);
      expect(parseState('tempo=-4').tempo).toBe(TEMPO_MIN);
    });

    it('clamps a tempo above the maximum', () => {
      expect(parseState('tempo=99').tempo).toBe(TEMPO_MAX);
    });

    it('drops a non-integer tempo rather than clamping garbage', () => {
      expect(parseState('tempo=fast').tempo).toBeUndefined();
    });
  });
});

describe('round-trip (property-based)', () => {
  it('parse(serialize(state)) recovers the original for any valid state', () => {
    fc.assert(
      fc.property(
        fc.record({
          rule: fc.integer({ min: 0, max: 255 }),
          seed: fc.integer({ min: 0, max: 0xffffffff }),
          scale: fc.constantFrom(...SCALE_NAMES),
          root: fc.constantFrom(...NOTE_NAMES),
          tempo: fc.integer({ min: TEMPO_MIN, max: TEMPO_MAX }),
        }),
        (state) => {
          const restored = parseState(serializeState(state));
          expect(restored).toEqual(state);
        },
      ),
    );
  });

  it('never throws on arbitrary string input', () => {
    fc.assert(
      fc.property(fc.string(), (raw) => {
        expect(() => parseState(raw)).not.toThrow();
      }),
    );
  });

  it('serialize output always re-parses to a complete, valid state', () => {
    fc.assert(
      fc.property(
        fc.record({
          rule: fc.integer({ min: -1000, max: 1000 }),
          seed: fc.integer(),
          scale: fc.constantFrom(...SCALE_NAMES),
          root: fc.constantFrom(...NOTE_NAMES),
          tempo: fc.integer({ min: -100, max: 100 }),
        }),
        (state) => {
          const restored = parseState(serializeState(state));
          expect(restored.rule).toBeGreaterThanOrEqual(0);
          expect(restored.rule).toBeLessThanOrEqual(255);
          expect(restored.tempo).toBeGreaterThanOrEqual(TEMPO_MIN);
          expect(restored.tempo).toBeLessThanOrEqual(TEMPO_MAX);
          expect(SCALE_NAMES).toContain(restored.scale);
          expect(NOTE_NAMES).toContain(restored.root);
        },
      ),
    );
  });
});
