import { describe, expect, it } from 'vitest';
import {
  SCALES,
  SCALE_NAMES,
  midiToFrequency,
  noteForColumn,
  rootToMidi,
  scaleNotes,
} from '../src/lib/scale.js';

describe('midiToFrequency', () => {
  it('returns 440Hz for A4 (MIDI 69)', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 5);
  });

  it('returns 220Hz one octave below A4', () => {
    expect(midiToFrequency(57)).toBeCloseTo(220, 5);
  });
});

describe('rootToMidi', () => {
  it('maps C to MIDI 60', () => {
    expect(rootToMidi('C')).toBe(60);
  });

  it('throws on an unknown root', () => {
    expect(() => rootToMidi('H')).toThrow();
  });
});

describe('scaleNotes', () => {
  it('every note is a scale member relative to the root, for every scale', () => {
    SCALE_NAMES.forEach((scaleName) => {
      const rootMidi = rootToMidi('C');
      const notes = scaleNotes(scaleName, 'C', 3);
      notes.forEach((midi) => {
        const semitone = ((midi - rootMidi) % 12 + 12) % 12;
        expect(SCALES[scaleName]).toContain(semitone);
      });
    });
  });

  it('spans the requested number of octaves', () => {
    const notes = scaleNotes('major', 'C', 2);
    expect(notes).toHaveLength(SCALES.major.length * 2);
  });

  it('throws on an unknown scale name', () => {
    expect(() => scaleNotes('lydian', 'C', 2)).toThrow(/Unknown scale/);
  });
});

describe('noteForColumn', () => {
  it('returns only in-scale frequencies for every column across the width', () => {
    const width = 64;
    const root = 'A';
    const scaleName = 'pentatonic';
    const rootMidi = rootToMidi(root);
    for (let column = 0; column < width; column += 1) {
      const freq = noteForColumn(column, width, { scale: scaleName, root, octaves: 3 });
      const midi = Math.round(12 * Math.log2(freq / 440) + 69);
      const semitone = ((midi - rootMidi) % 12 + 12) % 12;
      expect(SCALES[scaleName]).toContain(semitone);
    }
  });

  it('maps the leftmost column to the lowest note and rightmost near the highest', () => {
    const width = 32;
    const low = noteForColumn(0, width, { scale: 'major', root: 'C' });
    const high = noteForColumn(width - 1, width, { scale: 'major', root: 'C' });
    expect(high).toBeGreaterThan(low);
  });

  it('does not throw or divide by zero for width 1', () => {
    expect(() => noteForColumn(0, 1)).not.toThrow();
  });

  it('defaults to a valid frequency when options are omitted', () => {
    const freq = noteForColumn(5, 20);
    expect(freq).toBeGreaterThan(0);
    expect(Number.isFinite(freq)).toBe(true);
  });

  it('stays finite for a degenerate width of 0', () => {
    const freq = noteForColumn(0, 0);
    expect(Number.isFinite(freq)).toBe(true);
    expect(freq).toBeGreaterThan(0);
  });

  it('clamps a column past the width to the highest note instead of undefined', () => {
    const width = 16;
    const overshoot = noteForColumn(width + 5, width, { scale: 'major', root: 'C' });
    const last = noteForColumn(width - 1, width, { scale: 'major', root: 'C' });
    const topNote = midiToFrequency(scaleNotes('major', 'C', 3).at(-1));
    expect(Number.isFinite(overshoot)).toBe(true);
    expect(overshoot).toBeGreaterThanOrEqual(last);
    expect(overshoot).toBeCloseTo(topNote, 5);
  });

  it('clamps a negative column to the lowest note instead of undefined', () => {
    const freq = noteForColumn(-3, 16, { scale: 'major', root: 'C' });
    const lowest = noteForColumn(0, 16, { scale: 'major', root: 'C' });
    expect(Number.isFinite(freq)).toBe(true);
    expect(freq).toBe(lowest);
  });
});
