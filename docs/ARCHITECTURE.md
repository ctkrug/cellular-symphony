# Architecture

## Overview

Cellular Symphony is a single-page vanilla-JS app built with Vite. There is
no framework and no backend: `src/main.js` wires a handful of pure,
independently-testable logic modules (`src/lib/*.js`) to the DOM and the Web
Audio API. The production build is a static `dist/` directory with only
relative asset paths, deployable to a subpath.

## Module map

```
src/
  main.js            entry point: DOM wiring, transport loop, event handlers
  style.css           design tokens + component styles (docs/DESIGN.md)
  lib/
    automaton.js      elementary CA engine: nextRow(rule, row, boundary)
    rule.js           rule-number <-> 8-bit array helpers (get/set/toggle bit)
    random.js         seeded PRNG (mulberry32) + per-load randomness
    scale.js          column -> scale-quantized frequency mapping
    synth.js          ADSR envelope (pure) + Web Audio voice/graph wiring
    tempo.js          steps/sec clamping and ms-interval conversion
    mute.js           localStorage-backed mute persistence
    presets.js         curated rule gallery data
    urlState.js       shareable rule/seed/scale/root/tempo URL codec
```

Every module under `src/lib/` is DOM/Audio-free except `synth.js`, which
separates its pure envelope shape (`envelopeGainAt`, unit tested directly)
from its thin Web Audio scheduling (`triggerNote`, `createAudioGraph`).
This split is what makes the envelope shape testable without mocking audio
nodes.

## Data flow (the wow moment)

1. On load, `main.js` first reads any shared state from `location.search`
   via `parseState` (`urlState.js`); each field absent or invalid falls back
   to a random `rule` (0-255) / integer `seed`. It then expands `seed` into
   the initial row via `seedRowFromSeed(width, seed)` — deterministic given
   the seed, but a bare load draws it fresh, so two loads never match.
   Every control change mirrors the state back to the URL through
   `serializeState` + `history.replaceState`, making patterns shareable.
2. Pressing Play calls `ensureAudio()` (lazily creates the `AudioContext` +
   master gain -> compressor graph, required by the browser's autoplay
   policy to happen on a user gesture) and starts the step loop.
3. Each step (`step()` in `main.js`):
   - computes the next row via `nextRow(rule, row)`,
   - pushes it into the scrolling row buffer and redraws the canvas,
   - for every live cell in that row, maps its column to a frequency via
     `noteForColumn(column, width, {scale, root})` and triggers a
     synthesized note via `triggerNote` — **in the same tick that computed
     the row**, so there is no drift between what's drawn and what's heard.
   - re-schedules itself via `setTimeout` at the current tempo's interval
     (`tempoToIntervalMs`), so a mid-flight tempo change takes effect on the
     very next step.
4. The 8 rule-bit toggle buttons each flip one bit of `rule` via
   `toggleBit` — this mutates shared state read by the next `step()`, so no
   restart is needed for a rule change to take effect.

## Rendering

The canvas is a scrolling grid: `state.rows` holds up to `maxVisibleRows()`
rows (computed from the stage panel's rendered height / a fixed cell
height), with the newest row at index 0. `draw()` clears and redraws the
whole grid every step — simple and fast enough at these dimensions (at most
a few dozen visible rows x 48 columns).

## How to run / test

```bash
npm install
npm run dev      # Vite dev server
npm test         # Vitest unit + jsdom smoke tests
npm run lint      # ESLint
npm run build     # static production build to dist/
```

`test/*.test.js` mirrors `src/lib/*.js` one-to-one for pure logic, plus
`test/main.smoke.test.js` which mounts the real markup structure in jsdom,
mocks `HTMLCanvasElement.getContext` and `AudioContext`, and drives the
actual DOM event handlers (play/pause, rule toggles, reset, mute, presets).
