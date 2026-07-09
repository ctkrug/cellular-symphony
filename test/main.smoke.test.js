// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('play/pause wiring', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="automaton-canvas"></canvas>
      <button id="play-toggle" type="button" aria-pressed="false">Play</button>
      <span id="status-text"></span>
    `;
    window.HTMLCanvasElement.prototype.getContext = () => ({
      fillRect: vi.fn(),
      setTransform: vi.fn(),
    });
    window.AudioContext = vi.fn().mockImplementation(() => ({
      currentTime: 0,
      createOscillator: () => ({
        connect: () => ({ connect: vi.fn() }),
        frequency: {},
        start: vi.fn(),
        stop: vi.fn(),
      }),
      createGain: () => ({
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      }),
      destination: {},
    }));
  });

  it('toggles aria-pressed, label, and status text on click', async () => {
    await import(/* @vite-ignore */ `../src/main.js?t=${Date.now()}`);
    const button = document.getElementById('play-toggle');
    const status = document.getElementById('status-text');

    expect(button.getAttribute('aria-pressed')).toBe('false');
    button.click();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.textContent).toBe('Pause');
    expect(status.textContent).toBe('running');

    button.click();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.textContent).toBe('Play');
    expect(status.textContent).toBe('idle');
  });
});
