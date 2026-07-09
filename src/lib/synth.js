/**
 * Oscillator-based synth voice with an ADSR-style envelope. The envelope
 * shape itself (envelopeGainAt) is pure and DOM/Audio-free so it can be
 * unit tested directly; triggerNote/createAudioGraph are the thin Web
 * Audio wiring on top of it. No audio file assets are referenced anywhere
 * in this module — every sound is synthesized.
 */

const DEFAULT_ENV = {
  attack: 0.01,
  decay: 0.08,
  sustain: 0.3,
  hold: 0.05,
  release: 0.2,
};

/**
 * Total duration in seconds of a note shaped by the given envelope.
 * @param {object} [env]
 * @returns {number}
 */
export function envelopeDuration(env = {}) {
  const { attack, decay, hold, release } = { ...DEFAULT_ENV, ...env };
  return attack + decay + hold + release;
}

/**
 * Pure envelope shape: the gain value at `elapsed` seconds after note-on.
 * Ramps 0 -> 1 over `attack`, decays 1 -> sustain over `decay`, holds
 * `sustain` for `hold`, then decays sustain -> 0 over `release`.
 * @param {number} elapsed - seconds since note-on
 * @param {object} [env] - {attack, decay, sustain, hold, release}
 * @returns {number} gain in [0, 1]
 */
export function envelopeGainAt(elapsed, env = {}) {
  const { attack, decay, sustain, hold, release } = { ...DEFAULT_ENV, ...env };
  if (elapsed < 0) return 0;
  if (elapsed < attack) return attack === 0 ? 1 : elapsed / attack;

  const decayStart = attack;
  if (elapsed < decayStart + decay) {
    const t = decay === 0 ? 1 : (elapsed - decayStart) / decay;
    return 1 - (1 - sustain) * t;
  }

  const holdStart = decayStart + decay;
  if (elapsed < holdStart + hold) return sustain;

  const releaseStart = holdStart + hold;
  if (elapsed < releaseStart + release) {
    const t = release === 0 ? 1 : (elapsed - releaseStart) / release;
    return sustain * (1 - t);
  }

  return 0;
}

/**
 * Create the shared master gain -> compressor -> destination graph so
 * simultaneous notes never clip above 0dBFS.
 * @param {AudioContext} audioContext
 * @returns {{masterGain: GainNode, compressor: DynamicsCompressorNode}}
 */
export function createAudioGraph(audioContext) {
  const masterGain = audioContext.createGain();
  const compressor = audioContext.createDynamicsCompressor();
  masterGain.connect(compressor);
  compressor.connect(audioContext.destination);
  return { masterGain, compressor };
}

/**
 * Trigger a single synthesized note: an oscillator shaped by the ADSR
 * envelope, connected into `destination` (typically the master gain).
 * @param {AudioContext} audioContext
 * @param {AudioNode} destination
 * @param {number} frequency - Hz
 * @param {object} [options]
 * @param {OscillatorType} [options.type]
 * @param {number} [options.peakGain] - peak linear gain at the top of attack
 * @param {object} [options.env] - envelope overrides, see envelopeGainAt
 */
export function triggerNote(audioContext, destination, frequency, options = {}) {
  const { type = 'sine', peakGain = 0.2, env = {} } = options;
  const merged = { ...DEFAULT_ENV, ...env };
  const now = audioContext.currentTime;

  const oscillator = audioContext.createOscillator();
  oscillator.type = type;
  oscillator.frequency.value = frequency;

  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peakGain, now + merged.attack);
  gain.gain.linearRampToValueAtTime(
    peakGain * merged.sustain,
    now + merged.attack + merged.decay,
  );
  gain.gain.setValueAtTime(
    peakGain * merged.sustain,
    now + merged.attack + merged.decay + merged.hold,
  );
  gain.gain.linearRampToValueAtTime(0, now + envelopeDuration(merged));

  oscillator.connect(gain).connect(destination);
  oscillator.start(now);
  oscillator.stop(now + envelopeDuration(merged) + 0.02);
}
