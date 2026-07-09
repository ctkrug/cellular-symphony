// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function loadMain() {
  vi.resetModules();
  await import(/* @vite-ignore */ '../src/main.js');
}

function setSearch(search) {
  window.history.replaceState(null, '', `${window.location.pathname}${search}`);
}

function installDom() {
  document.body.innerHTML = `
    <canvas id="automaton-canvas"></canvas>
    <div id="waveform"></div>
    <button id="play-toggle" type="button" aria-pressed="false">Play</button>
    <button id="reset-button" type="button">Reset</button>
    <button id="mute-toggle" type="button" aria-pressed="false">🔊</button>
    <p id="status-text"></p>
    <div id="rule-number"></div>
    <div id="rule-toggles"></div>
    <input id="tempo-input" type="range" min="1" max="12" value="4" />
    <span id="tempo-value"></span>
    <select id="scale-select"></select>
    <select id="root-select"></select>
    <div id="preset-list"></div>
  `;
  window.HTMLCanvasElement.prototype.getContext = () => ({
    fillRect: vi.fn(),
    setTransform: vi.fn(),
  });
  window.matchMedia =
    window.matchMedia ||
    (() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  window.AudioContext = vi.fn().mockImplementation(() => ({
    currentTime: 0,
    createOscillator: () => ({
      type: 'sine',
      frequency: {},
      connect() {
        return this;
      },
      start: vi.fn(),
      stop: vi.fn(),
    }),
    createGain: () => ({
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect() {
        return this;
      },
    }),
    createDynamicsCompressor: () => ({
      connect: vi.fn(),
    }),
    destination: {},
  }));
}

describe('play/pause wiring', () => {
  beforeEach(() => {
    installDom();
  });

  it('toggles aria-pressed, label, and status text on click', async () => {
    await loadMain();
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

describe('rule toggles', () => {
  beforeEach(() => {
    installDom();
  });

  it('renders 8 rule-bit toggle buttons', async () => {
    await loadMain();
    const toggles = document.querySelectorAll('#rule-toggles .rule-toggle');
    expect(toggles).toHaveLength(8);
  });

  it('flipping a toggle updates the rule readout immediately', async () => {
    await loadMain();
    const readout = document.getElementById('rule-number');
    const before = readout.textContent;
    const firstToggle = document.querySelector('#rule-toggles .rule-toggle');
    firstToggle.click();
    expect(readout.textContent).not.toBe(before);
  });
});

describe('reset', () => {
  beforeEach(() => {
    installDom();
  });

  it('stops playback and resets status to idle', async () => {
    await loadMain();
    const playButtonEl = document.getElementById('play-toggle');
    const status = document.getElementById('status-text');
    playButtonEl.click();
    expect(status.textContent).toBe('running');
    document.getElementById('reset-button').click();
    expect(status.textContent).toBe('idle');
    expect(playButtonEl.getAttribute('aria-pressed')).toBe('false');
  });
});

describe('mute', () => {
  beforeEach(() => {
    installDom();
  });

  it('toggles aria-pressed and icon on click', async () => {
    await loadMain();
    const muteButtonEl = document.getElementById('mute-toggle');
    expect(muteButtonEl.getAttribute('aria-pressed')).toBe('false');
    muteButtonEl.click();
    expect(muteButtonEl.getAttribute('aria-pressed')).toBe('true');
    expect(muteButtonEl.textContent).toBe('🔇');
  });
});

describe('URL state (Story 8)', () => {
  beforeEach(() => {
    installDom();
  });

  afterEach(() => {
    setSearch('');
  });

  it('restores rule, scale, root, and tempo from the query string', async () => {
    setSearch('?rule=90&seed=42&scale=pentatonic&root=A&tempo=9');
    await loadMain();
    expect(document.getElementById('rule-number').textContent).toBe('090');
    expect(document.getElementById('scale-select').value).toBe('pentatonic');
    expect(document.getElementById('root-select').value).toBe('A');
    expect(document.getElementById('tempo-input').value).toBe('9');
    expect(document.getElementById('tempo-value').textContent).toBe('9/s');
  });

  it('reflects a rule-bit toggle back into the URL without adding history', async () => {
    setSearch('?rule=90&seed=42&scale=major&root=C&tempo=4');
    const historyLength = window.history.length;
    await loadMain();
    document.querySelector('#rule-toggles .rule-toggle').click();
    const params = new URLSearchParams(window.location.search);
    // Toggling bit 7 (the first rendered switch) flips rule 90 -> 218.
    expect(params.get('rule')).toBe('218');
    expect(params.get('seed')).toBe('42');
    expect(window.history.length).toBe(historyLength);
  });

  it('writes the current scale selection into the URL on change', async () => {
    setSearch('?rule=90&seed=42&scale=major&root=C&tempo=4');
    await loadMain();
    const scaleSelect = document.getElementById('scale-select');
    scaleSelect.value = 'minor';
    scaleSelect.dispatchEvent(new window.Event('change'));
    expect(new URLSearchParams(window.location.search).get('scale')).toBe('minor');
  });

  it('ignores a malformed query and falls back to a valid random state', async () => {
    setSearch('?rule=notanumber&seed=-1&scale=lydian&tempo=999');
    await loadMain();
    const rule = Number(document.getElementById('rule-number').textContent);
    expect(rule).toBeGreaterThanOrEqual(0);
    expect(rule).toBeLessThanOrEqual(255);
    // Unknown scale dropped -> default 'major'.
    expect(document.getElementById('scale-select').value).toBe('major');
  });
});

describe('presets', () => {
  beforeEach(() => {
    installDom();
  });

  it('renders at least 6 preset buttons', async () => {
    await loadMain();
    const buttons = document.querySelectorAll('#preset-list .preset-button');
    expect(buttons.length).toBeGreaterThanOrEqual(6);
  });

  it('selecting a preset while playing does not spawn a second step loop', async () => {
    // prefers-reduced-motion so no transient pulse timers pollute the count.
    window.matchMedia = () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.useFakeTimers();
    try {
      await loadMain();
      document.getElementById('play-toggle').click();
      // Exactly one pending step timer while playing.
      expect(vi.getTimerCount()).toBe(1);
      document.querySelector('#preset-list .preset-button').click();
      // Still exactly one — the old timer must be cleared, not orphaned.
      expect(vi.getTimerCount()).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
