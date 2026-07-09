/**
 * Elementary 1D cellular automaton (Wolfram rule 0-255), toroidal boundary.
 * Pure, DOM/Audio-free so it can be unit tested and reused by the audio layer.
 */

/**
 * Compute the next row from the current row under the given rule number.
 * @param {number} rule - 0-255 Wolfram rule number.
 * @param {number[]} row - current row of 0/1 cell states.
 * @param {'wrap'|'dead'} [boundary] - 'wrap' (toroidal, default) treats the
 *   edges as connected; 'dead' treats off-grid neighbors as always 0.
 * @returns {number[]} the next row, same length as `row`.
 */
export function nextRow(rule, row, boundary = 'wrap') {
  const width = row.length;
  const next = new Array(width);
  const at = (i) => {
    if (boundary === 'dead') return i < 0 || i >= width ? 0 : row[i];
    return row[(i + width) % width];
  };
  for (let i = 0; i < width; i += 1) {
    const left = at(i - 1);
    const center = row[i];
    const right = at(i + 1);
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
