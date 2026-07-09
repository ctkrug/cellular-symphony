import { nextRow } from './lib/automaton.js';
import { bitsFromRule, getBit, toggleBit } from './lib/rule.js';
import { randomRule, randomSeed, seedRowFromSeed } from './lib/random.js';
import { NOTE_NAMES, SCALE_NAMES, noteForColumn } from './lib/scale.js';
import { createAudioGraph, triggerNote } from './lib/synth.js';
import { getStoredMute, setStoredMute } from './lib/mute.js';
import { TEMPO_MAX, TEMPO_MIN, clampTempo, tempoToIntervalMs } from './lib/tempo.js';
import { PRESETS } from './lib/presets.js';

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
const muteButton = document.getElementById('mute-toggle');
const statusText = document.getElementById('status-text');
const ruleNumberEl = document.getElementById('rule-number');
const ruleTogglesEl = document.getElementById('rule-toggles');
const tempoInput = document.getElementById('tempo-input');
const tempoValueEl = document.getElementById('tempo-value');
const scaleSelect = document.getElementById('scale-select');
const rootSelect = document.getElementById('root-select');
const presetListEl = document.getElementById('preset-list');

const state = {
  rule: randomRule(),
  seed: randomSeed(),
  row: null,
  rows: [],
  playing: false,
  muted: getStoredMute(),
  tempo: clampTempo(Number(tempoInput.value) || 4),
  scale: 'major',
  root: 'C',
};
state.row = seedRowFromSeed(WIDTH, state.seed);
state.rows = [state.row];

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
      });
      ruleTogglesEl.appendChild(button);
    });
}

playButton.addEventListener('click', () => setPlaying(!state.playing));

resetButton.addEventListener('click', () => {
  setPlaying(false);
  state.seed = randomSeed();
  state.row = seedRowFromSeed(WIDTH, state.seed);
  state.rows = [state.row];
  draw();
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
tempoInput.addEventListener('input', () => {
  state.tempo = clampTempo(Number(tempoInput.value));
  tempoValueEl.textContent = `${state.tempo}/s`;
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
    draw();
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
draw();
