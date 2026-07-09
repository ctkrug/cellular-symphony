import { nextRow, seedRow } from './lib/automaton.js';

const RULE = 30;
const WIDTH = 64;

const canvas = document.getElementById('automaton-canvas');
const ctx = canvas.getContext('2d');
const playButton = document.getElementById('play-toggle');
const statusText = document.getElementById('status-text');

let row = seedRow(WIDTH);
let audioContext = null;
let playing = false;

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawRow() {
  const rect = canvas.getBoundingClientRect();
  const cellWidth = rect.width / row.length;
  ctx.fillStyle = '#1c1f26';
  ctx.fillRect(0, 0, rect.width, rect.height);
  ctx.fillStyle = '#f2a93b';
  row.forEach((cell, i) => {
    if (cell) ctx.fillRect(i * cellWidth, rect.height / 2 - 4, cellWidth, 8);
  });
}

function tick() {
  if (!playing) return;
  row = nextRow(RULE, row);
  drawRow();
  window.setTimeout(tick, 400);
}

function beep() {
  if (!audioContext) audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.frequency.value = 440;
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.3);
}

playButton.addEventListener('click', () => {
  playing = !playing;
  playButton.setAttribute('aria-pressed', String(playing));
  playButton.textContent = playing ? 'Pause' : 'Play';
  statusText.textContent = playing ? 'running' : 'idle';
  if (playing) {
    beep();
    tick();
  }
});

window.addEventListener('resize', () => {
  resizeCanvas();
  drawRow();
});

resizeCanvas();
drawRow();
