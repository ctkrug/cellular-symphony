import { nextRow } from './lib/automaton.js';
import { bitsFromRule, getBit, toggleBit } from './lib/rule.js';
import { randomRule, randomSeed, seedRowFromSeed } from './lib/random.js';
import { NOTE_NAMES, SCALE_NAMES, noteForColumn } from './lib/scale.js';
import { createAudioGraph, triggerNote } from './lib/synth.js';
import { getStoredMute, setStoredMute } from './lib/mute.js';
import { TEMPO_MAX, TEMPO_MIN, clampTempo, tempoToIntervalMs } from './lib/tempo.js';
import { PRESETS } from './lib/presets.js';
import { parseState, serializeState } from './lib/urlState.js';

const WIDTH = 48;
const CELL_HEIGHT = 10;
const prefersReducedMotion =
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = document.getElementById('automaton-canvas');
const ctx = canvas.getContext('2d');
const waveform = document.getElementById('waveform');
const playButton = document.getElementById('play-toggle');
const resetButton = document.getElementById('reset-button');
const shareButton = document.getElementById('share-button');
const toast = document.getElementById('toast');
const muteButton = document.getElementById('mute-toggle');
const statusText = document.getElementById('status-text');
const ruleNumberEl = document.getElementById('rule-number');
const ruleTogglesEl = document.getElementById('rule-toggles');
const tempoInput = document.getElementById('tempo-input');
const tempoValueEl = document.getElementById('tempo-value');
const scaleSelect = document.getElementById('scale-select');
const rootSelect = document.getElementById('root-select');
const presetListEl = document.getElementById('preset-list');

// A shared link (?rule=&seed=&scale=&root=&tempo=) reproduces an exact
// pattern; anything absent or invalid falls back to a fresh random value so
// a bare load still gets the "reload = new pattern" wow moment.
const shared = parseState(
  typeof window.location !== 'undefined' ? window.location.search : '',
);

const state = {
  rule: shared.rule ?? randomRule(),
  seed: shared.seed ?? randomSeed(),
  row: null,
  rows: [],
  playing: false,
  muted: getStoredMute(),
  tempo: shared.tempo ?? clampTempo(Number(tempoInput.value) || 4),
  scale: shared.scale ?? 'major',
  root: shared.root ?? 'C',
};
state.row = seedRowFromSeed(WIDTH, state.seed);
state.rows = [state.row];

function updateUrl() {
  if (typeof window.history?.replaceState !== 'function') return;
  const query = serializeState(state);
  try {
    // replaceState (not pushState) keeps every control change out of the
    // back-button history, so dragging the tempo slider can't spam it.
    window.history.replaceState(null, '', `?${query}`);
  } catch {
    // Some browsers reject replaceState on a file:// document; the app still
    // works, links just aren't shareable in that context.
  }
}

let audioContext = null;
let masterGain = null;
let stepTimer = null;

function ensureAudio() {
  if (audioContext) return;
  audioContext = new AudioContext();
  const graph = createAudioGraph(audioContext);
  masterGain = graph.masterGain;
  masterGain.gain.value = state.muted ? 0 : 1;
}

function maxVisibleRows() {
  const rect = canvas.getBoundingClientRect();
  return Math.max(1, Math.floor(rect.height / CELL_HEIGHT));
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function draw() {
  const rect = canvas.getBoundingClientRect();
  const cellWidth = rect.width / WIDTH;
  ctx.fillStyle = '#1c1f26';
  ctx.fillRect(0, 0, rect.width, rect.height);
  ctx.fillStyle = '#f2a93b';
  state.rows.forEach((row, rowIndex) => {
    const y = rowIndex * CELL_HEIGHT;
    row.forEach((cell, col) => {
      if (cell) ctx.fillRect(col * cellWidth, y, Math.ceil(cellWidth) - 1, CELL_HEIGHT - 1);
    });
  });
}

function pulseWaveform() {
  if (prefersReducedMotion) return;
  waveform.classList.add('active');
  window.setTimeout(() => waveform.classList.remove('active'), 150);
}

function pulseToggleForNeighborhood(neighborhood) {
  if (prefersReducedMotion) return;
  const button = ruleTogglesEl.querySelector(`[data-neighborhood="${neighborhood}"]`);
  if (!button) return;
  button.classList.add('pulse');
  window.setTimeout(() => button.classList.remove('pulse'), 150);
}

function neighborhoodsInRow(row) {
  const width = row.length;
  const seen = new Set();
  for (let i = 0; i < width; i += 1) {
    const left = row[(i - 1 + width) % width];
    const center = row[i];
    const right = row[(i + 1) % width];
    seen.add((left << 2) | (center << 1) | right);
  }
  return seen;
}

function playNotesForRow(row) {
  if (!audioContext || state.muted) return;
  let triggered = false;
  row.forEach((cell, col) => {
    if (!cell) return;
    triggered = true;
    const frequency = noteForColumn(col, WIDTH, { scale: state.scale, root: state.root });
    triggerNote(audioContext, masterGain, frequency);
  });
  if (triggered) pulseWaveform();
}

function step() {
  const nextGeneration = nextRow(state.rule, state.row);
  neighborhoodsInRow(state.row).forEach(pulseToggleForNeighborhood);
  state.row = nextGeneration;
  state.rows.unshift(nextGeneration);
  const cap = maxVisibleRows();
  if (state.rows.length > cap) state.rows.length = cap;
  playNotesForRow(nextGeneration);
  draw();
}

// Fill the stage with a static preview evolved silently from the current
// seed so the hero panel shows the pattern on load / after reset instead of
// sitting empty until Play — pressing Play then continues from this state.
function prefillStage() {
  const cap = maxVisibleRows();
  let row = state.row;
  const rows = [row];
  for (let i = 1; i < cap; i += 1) {
    row = nextRow(state.rule, row);
    rows.unshift(row);
  }
  state.row = row;
  state.rows = rows;
}

function scheduleNextStep() {
  stepTimer = window.setTimeout(() => {
    if (!state.playing) return;
    step();
    scheduleNextStep();
  }, tempoToIntervalMs(state.tempo));
}

function setPlaying(playing) {
  state.playing = playing;
  playButton.setAttribute('aria-pressed', String(playing));
  playButton.textContent = playing ? 'Pause' : 'Play';
  statusText.textContent = playing ? 'running' : 'idle';
  // Always tear down the existing step loop first so entering setPlaying(true)
  // while already running (e.g. selecting a preset) re-arms a single timer
  // chain instead of orphaning the previous one.
  if (stepTimer) {
    window.clearTimeout(stepTimer);
    stepTimer = null;
  }
  if (playing) {
    ensureAudio();
    step();
    scheduleNextStep();
  }
}

function renderRuleNumber() {
  ruleNumberEl.textContent = String(state.rule).padStart(3, '0');
}

function renderRuleToggles() {
  ruleTogglesEl.innerHTML = '';
  bitsFromRule(state.rule)
    .slice()
    .reverse()
    .forEach((_bit, reversedIndex) => {
      const neighborhood = 7 - reversedIndex;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'rule-toggle';
      button.style.setProperty('--i', String(reversedIndex));
      button.dataset.neighborhood = String(neighborhood);
      button.setAttribute('aria-pressed', String(getBit(state.rule, neighborhood) === 1));
      button.setAttribute(
        'aria-label',
        `Neighborhood ${neighborhood.toString(2).padStart(3, '0')} produces`,
      );
      button.textContent = neighborhood.toString(2).padStart(3, '0');
      button.addEventListener('click', () => {
        state.rule = toggleBit(state.rule, neighborhood);
        renderRuleNumber();
        button.setAttribute('aria-pressed', String(getBit(state.rule, neighborhood) === 1));
        updateUrl();
      });
      ruleTogglesEl.appendChild(button);
    });
}

let toastTimer = null;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove('show');
    toast.textContent = '';
  }, 1600);
}

playButton.addEventListener('click', () => setPlaying(!state.playing));

if (shareButton) {
  shareButton.addEventListener('click', async () => {
    updateUrl();
    const url = typeof window.location !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showToast('link copied');
      } else {
        showToast('copy from address bar');
      }
    } catch {
      // Clipboard blocked (insecure context, permission denied) — the URL is
      // still in the address bar, so tell the user to copy it manually.
      showToast('copy from address bar');
    }
  });
}

resetButton.addEventListener('click', () => {
  setPlaying(false);
  state.seed = randomSeed();
  state.row = seedRowFromSeed(WIDTH, state.seed);
  state.rows = [state.row];
  prefillStage();
  draw();
  updateUrl();
});

muteButton.addEventListener('click', () => {
  state.muted = !state.muted;
  setStoredMute(state.muted);
  muteButton.setAttribute('aria-pressed', String(state.muted));
  muteButton.textContent = state.muted ? '🔇' : '🔊';
  muteButton.setAttribute('aria-label', state.muted ? 'Unmute' : 'Mute');
  if (masterGain) masterGain.gain.value = state.muted ? 0 : 1;
});

tempoInput.min = String(TEMPO_MIN);
tempoInput.max = String(TEMPO_MAX);
tempoInput.value = String(state.tempo);
tempoInput.addEventListener('input', () => {
  state.tempo = clampTempo(Number(tempoInput.value));
  tempoValueEl.textContent = `${state.tempo}/s`;
  updateUrl();
});

SCALE_NAMES.forEach((name) => {
  const option = document.createElement('option');
  option.value = name;
  option.textContent = name;
  scaleSelect.appendChild(option);
});
scaleSelect.value = state.scale;
scaleSelect.addEventListener('change', () => {
  state.scale = scaleSelect.value;
  updateUrl();
});

NOTE_NAMES.forEach((name) => {
  const option = document.createElement('option');
  option.value = name;
  option.textContent = name;
  rootSelect.appendChild(option);
});
rootSelect.value = state.root;
rootSelect.addEventListener('change', () => {
  state.root = rootSelect.value;
  updateUrl();
});

PRESETS.forEach((preset) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'preset-button';
  button.textContent = preset.label;
  button.addEventListener('click', () => {
    state.rule = preset.rule;
    state.seed = randomSeed();
    state.row = seedRowFromSeed(WIDTH, state.seed);
    state.rows = [state.row];
    renderRuleNumber();
    renderRuleToggles();
    prefillStage();
    draw();
    updateUrl();
    setPlaying(true);
  });
  presetListEl.appendChild(button);
});

muteButton.setAttribute('aria-pressed', String(state.muted));
muteButton.textContent = state.muted ? '🔇' : '🔊';
tempoValueEl.textContent = `${state.tempo}/s`;

window.addEventListener('resize', () => {
  resizeCanvas();
  draw();
});

renderRuleNumber();
renderRuleToggles();
resizeCanvas();
prefillStage();
draw();
