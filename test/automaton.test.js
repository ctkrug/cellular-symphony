import { describe, expect, it } from 'vitest';
import { nextRow, seedRow } from '../src/lib/automaton.js';

describe('seedRow', () => {
  it('creates a row with a single live cell at the center', () => {
    const row = seedRow(7);
    expect(row).toEqual([0, 0, 0, 1, 0, 0, 0]);
  });
});

describe('nextRow', () => {
  it('matches the known rule 30 sequence for a single-cell seed', () => {
    // Reference sequence for Wolfram's rule 30 starting from a single live
    // cell, width 7, toroidal wrap: https://en.wikipedia.org/wiki/Rule_30
    let row = seedRow(7);
    const generations = [row];
    for (let i = 0; i < 3; i += 1) {
      row = nextRow(30, row);
      generations.push(row);
    }

    expect(generations).toEqual([
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 0, 0, 1, 0],
      [1, 1, 0, 1, 1, 1, 1],
    ]);
  });

  it('preserves row width', () => {
    const row = nextRow(90, seedRow(15));
    expect(row).toHaveLength(15);
  });

  it('only ever produces 0/1 cell states', () => {
    const row = nextRow(110, seedRow(10));
    row.forEach((cell) => expect([0, 1]).toContain(cell));
  });

  it('defaults to toroidal (wrap) boundary', () => {
    // rule 1: only [0,0,0] -> 1; a single live cell at the edge means its
    // wrapped neighbor sees a live cell, so wrap and dead boundaries diverge.
    const row = [1, 0, 0, 0, 0, 0, 0, 0];
    const wrapped = nextRow(1, row);
    const explicit = nextRow(1, row, 'wrap');
    expect(wrapped).toEqual(explicit);
  });

  it('treats off-grid neighbors as dead under the dead boundary', () => {
    // rule 2 fires only on neighborhood [0,0,1] (right neighbor live).
    // The last cell's right neighbor is live-via-wraparound but off-grid
    // (and thus dead) under the 'dead' boundary.
    const row = [1, 0, 0, 0, 0, 0, 0, 0];
    const wrapped = nextRow(2, row, 'wrap');
    const dead = nextRow(2, row, 'dead');
    expect(wrapped[wrapped.length - 1]).toBe(1);
    expect(dead[dead.length - 1]).toBe(0);
  });
});
