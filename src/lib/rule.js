/**
 * Helpers for treating a Wolfram rule number (0-255) as 8 independent bits,
 * one per 3-cell neighborhood (0b111 down to 0b000). DOM/Audio-free.
 */

export const RULE_MIN = 0;
export const RULE_MAX = 255;
export const BIT_COUNT = 8;

/**
 * Clamp a rule number into the valid 0-255 range.
 * @param {number} rule
 * @returns {number}
 */
export function clampRule(rule) {
  if (Number.isNaN(rule)) return RULE_MIN;
  return Math.min(RULE_MAX, Math.max(RULE_MIN, Math.trunc(rule)));
}

/**
 * Read the bit for a given 3-cell neighborhood (0-7) out of a rule number.
 * @param {number} rule - 0-255
 * @param {number} neighborhood - 0-7
 * @returns {0|1}
 */
export function getBit(rule, neighborhood) {
  return (rule >> neighborhood) & 1;
}

/**
 * Return a new rule number with the given neighborhood's bit set to value.
 * @param {number} rule - 0-255
 * @param {number} neighborhood - 0-7
 * @param {0|1|boolean} value
 * @returns {number} the resulting rule, 0-255
 */
export function setBit(rule, neighborhood, value) {
  const bit = value ? 1 : 0;
  const mask = 1 << neighborhood;
  const cleared = rule & ~mask;
  return clampRule(cleared | (bit << neighborhood));
}

/**
 * Return a new rule number with the given neighborhood's bit flipped.
 * @param {number} rule - 0-255
 * @param {number} neighborhood - 0-7
 * @returns {number} the resulting rule, 0-255
 */
export function toggleBit(rule, neighborhood) {
  return setBit(rule, neighborhood, getBit(rule, neighborhood) === 0);
}

/**
 * Expand a rule number into its 8 bits, index 0 = neighborhood 0b000.
 * @param {number} rule - 0-255
 * @returns {number[]} length-8 array of 0/1
 */
export function bitsFromRule(rule) {
  return Array.from({ length: BIT_COUNT }, (_, i) => getBit(rule, i));
}

/**
 * Pack 8 bits (index 0 = neighborhood 0b000) back into a rule number.
 * @param {number[]} bits - length-8 array of 0/1
 * @returns {number} 0-255
 */
export function ruleFromBits(bits) {
  return bits.reduce((rule, bit, i) => rule | ((bit ? 1 : 0) << i), 0);
}
