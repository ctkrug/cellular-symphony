/**
 * Deterministic pseudo-random helpers. DOM/Audio-free.
 *
 * Playing the app uses genuine per-load randomness (a fresh rule/seed each
 * time), but that randomness is drawn once into a small integer seed which
 * then deterministically expands into the initial row. This is what makes
 * a seed value shareable and reproducible via a URL (Story 8) while still
 * giving "reload = new pattern" (Story 1) at the point where randomness is
 * actually drawn.
 */

const UINT32_MAX = 0xffffffff;

/**
 * Create a mulberry32 PRNG function seeded deterministically.
 * @param {number} seed - any integer; only the low 32 bits are used.
 * @returns {() => number} a function returning floats in [0, 1) on each call.
 */
export function createRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / (UINT32_MAX + 1);
  };
}

/**
 * Draw a random integer seed suitable for createRng/seedRowFromSeed,
 * sourced from real per-call randomness (not itself deterministic).
 * @returns {number} unsigned 32-bit integer
 */
export function randomSeed() {
  return Math.floor(Math.random() * (UINT32_MAX + 1)) >>> 0;
}

/**
 * Draw a random Wolfram rule number (0-255), sourced from real
 * per-call randomness.
 * @returns {number}
 */
export function randomRule() {
  return Math.floor(Math.random() * 256);
}

/**
 * Deterministically build a row of the given width from an integer seed:
 * each cell is independently live with ~50% probability, decided by the
 * seeded PRNG stream. The same seed always produces the same row.
 * @param {number} width
 * @param {number} seed
 * @returns {number[]}
 */
export function seedRowFromSeed(width, seed) {
  const rng = createRng(seed);
  return Array.from({ length: width }, () => (rng() < 0.5 ? 0 : 1));
}
