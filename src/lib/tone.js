/**
 * Minimal Web Audio helper for the scaffold demo. The full oscillator +
 * ADSR synth voice (Story 5) replaces this with scale-aware, multi-voice
 * synthesis; this stub only proves audio wiring works end to end.
 */

/**
 * Play a single short tone through the given AudioContext.
 * @param {AudioContext} audioContext
 * @param {number} frequency - in Hz
 */
export function playTone(audioContext, frequency) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.frequency.value = frequency;
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.3);
}
