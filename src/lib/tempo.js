/**
 * Transport tempo helpers. Clamping lives here (not just in the UI's
 * range input) so a malformed or out-of-range value from a URL/state
 * restore can never drive the stepping loop outside 1-12 steps/sec.
 */

export const TEMPO_MIN = 1;
export const TEMPO_MAX = 12;

/**
 * Clamp a steps-per-second value into the supported 1-12 range.
 * @param {number} stepsPerSecond
 * @returns {number}
 */
export function clampTempo(stepsPerSecond) {
  if (Number.isNaN(stepsPerSecond)) return TEMPO_MIN;
  return Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, stepsPerSecond));
}

/**
 * Convert a steps-per-second tempo into a step interval in milliseconds.
 * @param {number} stepsPerSecond
 * @returns {number}
 */
export function tempoToIntervalMs(stepsPerSecond) {
  return 1000 / clampTempo(stepsPerSecond);
}
