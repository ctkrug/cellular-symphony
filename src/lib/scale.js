/**
 * Musical scale quantization: maps a column index to a frequency that is
 * always a member of the chosen scale/root, so arbitrary automaton rules
 * stay listenable instead of producing unquantized noise. DOM/Audio-free.
 */

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Semitone offsets from the root, one octave.
export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
};

export const SCALE_NAMES = Object.keys(SCALES);

const MIDI_A4 = 69;
const FREQ_A4 = 440;
const MIDI_C4 = 60;

/**
 * Convert a MIDI note number to a frequency in Hz (A4 = 440Hz, 12-TET).
 * @param {number} midi
 * @returns {number}
 */
export function midiToFrequency(midi) {
  return FREQ_A4 * 2 ** ((midi - MIDI_A4) / 12);
}

/**
 * Convert a root note name (e.g. 'C', 'F#') to its MIDI number in octave 4.
 * @param {string} root
 * @returns {number}
 */
export function rootToMidi(root) {
  const index = NOTE_NAMES.indexOf(root);
  if (index === -1) throw new Error(`Unknown root note: ${root}`);
  return MIDI_C4 + index;
}

/**
 * Build the ordered list of MIDI notes in a scale, spanning `octaves`
 * octaves upward from the root.
 * @param {string} scaleName - one of SCALE_NAMES
 * @param {string} root - one of NOTE_NAMES
 * @param {number} [octaves]
 * @returns {number[]} ascending MIDI note numbers
 */
export function scaleNotes(scaleName, root, octaves = 3) {
  const intervals = SCALES[scaleName];
  if (!intervals) throw new Error(`Unknown scale: ${scaleName}`);
  const rootMidi = rootToMidi(root);
  const notes = [];
  for (let octave = 0; octave < octaves; octave += 1) {
    intervals.forEach((interval) => {
      notes.push(rootMidi + interval + octave * 12);
    });
  }
  return notes;
}

/**
 * Map a column index (0..width-1) to a frequency within the given scale
 * and root, spread evenly across `octaves` octaves so the leftmost column
 * is the lowest scale degree and the rightmost is the highest.
 * @param {number} column
 * @param {number} width - total number of columns (>= 1)
 * @param {object} [options]
 * @param {string} [options.scale] - one of SCALE_NAMES
 * @param {string} [options.root] - one of NOTE_NAMES
 * @param {number} [options.octaves]
 * @returns {number} frequency in Hz
 */
export function noteForColumn(column, width, options = {}) {
  const { scale = 'major', root = 'C', octaves = 3 } = options;
  const notes = scaleNotes(scale, root, octaves);
  const safeWidth = Math.max(1, width);
  const index = Math.min(notes.length - 1, Math.floor((column / safeWidth) * notes.length));
  return midiToFrequency(notes[Math.max(0, index)]);
}
