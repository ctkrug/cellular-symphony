import { describe, expect, it, vi } from 'vitest';
import { createAudioGraph, envelopeDuration, envelopeGainAt, triggerNote } from '../src/lib/synth.js';

describe('envelopeGainAt', () => {
  it('starts at ~0 at elapsed=0', () => {
    expect(envelopeGainAt(0)).toBeCloseTo(0, 5);
  });

  it('rises to 1 at the end of attack', () => {
    expect(envelopeGainAt(0.01)).toBeCloseTo(1, 5);
  });

  it('decays back to ~0 by the end of the full envelope duration', () => {
    const duration = envelopeDuration();
    expect(envelopeGainAt(duration)).toBeCloseTo(0, 5);
  });

  it('is 0 for negative elapsed (before note-on)', () => {
    expect(envelopeGainAt(-1)).toBe(0);
  });

  it('is 0 well after the envelope has finished', () => {
    expect(envelopeGainAt(envelopeDuration() + 5)).toBe(0);
  });

  it('holds at the sustain level during the hold phase', () => {
    const env = { attack: 0.01, decay: 0.05, sustain: 0.4, hold: 0.1, release: 0.1 };
    const midHold = env.attack + env.decay + env.hold / 2;
    expect(envelopeGainAt(midHold, env)).toBeCloseTo(0.4, 5);
  });

  it('handles a zero-attack envelope without dividing by zero', () => {
    expect(envelopeGainAt(0, { attack: 0 })).toBe(1);
  });

  it('is partway between sustain and 0 midway through the release phase', () => {
    const env = { attack: 0.01, decay: 0.05, sustain: 0.4, hold: 0.1, release: 0.2 };
    const midRelease = env.attack + env.decay + env.hold + env.release / 2;
    expect(envelopeGainAt(midRelease, env)).toBeCloseTo(0.2, 5);
  });

  it('drops straight to 0 for a zero-release envelope without dividing by zero', () => {
    const env = { attack: 0.01, decay: 0.05, sustain: 0.4, hold: 0.1, release: 0 };
    const releaseStart = env.attack + env.decay + env.hold;
    expect(envelopeGainAt(releaseStart, env)).toBe(0);
  });
});

describe('envelopeDuration', () => {
  it('sums attack + decay + hold + release', () => {
    const env = { attack: 0.01, decay: 0.02, hold: 0.03, release: 0.04 };
    expect(envelopeDuration(env)).toBeCloseTo(0.1, 10);
  });
});

function createMockAudioContext() {
  const gainParam = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  });
  return {
    currentTime: 0,
    createOscillator: vi.fn(() => ({
      type: 'sine',
      frequency: { value: 0 },
      connect: vi.fn(function connect() {
        return this;
      }),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createGain: vi.fn(() => ({
      gain: gainParam(),
      connect: vi.fn(function connect() {
        return this;
      }),
    })),
    createDynamicsCompressor: vi.fn(() => ({
      connect: vi.fn(),
    })),
    destination: {},
  };
}

describe('createAudioGraph', () => {
  it('wires masterGain -> compressor -> destination', () => {
    const audioContext = createMockAudioContext();
    const { masterGain, compressor } = createAudioGraph(audioContext);
    expect(masterGain.connect).toHaveBeenCalledWith(compressor);
    expect(compressor.connect).toHaveBeenCalledWith(audioContext.destination);
  });
});

describe('triggerNote', () => {
  it('starts and stops an oscillator at the given frequency', () => {
    const audioContext = createMockAudioContext();
    const destination = {};
    triggerNote(audioContext, destination, 440);
    const oscillator = audioContext.createOscillator.mock.results[0].value;
    expect(oscillator.frequency.value).toBe(440);
    expect(oscillator.start).toHaveBeenCalled();
    expect(oscillator.stop).toHaveBeenCalled();
  });

  it('ramps gain up then down rather than stepping instantly', () => {
    const audioContext = createMockAudioContext();
    triggerNote(audioContext, {}, 220);
    const gain = audioContext.createGain.mock.results[0].value;
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalled();
  });
});
