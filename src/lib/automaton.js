/**
 * Elementary 1D cellular automaton (Wolfram rule 0-255), toroidal boundary.
 * Pure, DOM/Audio-free so it can be unit tested and reused by the audio layer.
 */

/**
 * Compute the next row from the current row under the given rule number.
 * @param {number} rule - 0-255 Wolfram rule number.
 * @param {number[]} row - current row of 0/1 cell states.
 * @returns {number[]} the next row, same length as `row`.
 */
export function nextRow(rule, row) {
  const width = row.length;
  const next = new Array(width);
  for (let i = 0; i < width; i += 1) {
    const left = row[(i - 1 + width) % width];
    const center = row[i];
    const right = row[(i + 1) % width];
    const neighborhood = (left << 2) | (center << 1) | right;
    next[i] = (rule >> neighborhood) & 1;
  }
  return next;
}

/**
 * Build a seed row of the given width with a single live cell at the center.
 * @param {number} width
 * @returns {number[]}
 */
export function seedRow(width) {
  const row = new Array(width).fill(0);
  row[Math.floor(width / 2)] = 1;
  return row;
}
