# Cellular Symphony

[![CI](https://github.com/ctkrug/cellular-symphony/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/cellular-symphony/actions/workflows/ci.yml)

A cellular automaton that composes its own generative music, live. Every cell
state maps to a note and timbre, so a pattern's evolution is something you
watch **and** hear unfold together — no pre-baked samples, no separate score.

Hit play on a rule and the automaton starts scrolling while a genuinely
listenable, evolving melody plays in sync. Nudge a single bit of the rule and
both the visual pattern and the music audibly shift — the cause-and-effect
between what's on screen and what's in your ears stays legible the whole time,
which is the piece most generative-music toys leave out.

## Why

Elementary cellular automata (Wolfram's rule 0–255) are visually compelling on
their own, and generative music systems are compelling on their own, but the
two are rarely wired together in a way where you can actually *see* what's
driving the sound. Cellular Symphony renders a 1D automaton as a scrolling
grid and sonifies each new row the instant it's computed — the automaton
*is* the score, not an input to one.

## How it works

- A **1D elementary cellular automaton** advances one row per tempo tick,
  rendered top-to-bottom like a piano roll.
- Each column index maps to a **scale degree** (major / minor / pentatonic,
  configurable root note), so live cells in that row trigger notes —
  quantized to a musical scale so arbitrary rules stay musical instead of
  noisy.
- Notes are synthesized entirely with the **Web Audio API**
  (`OscillatorNode` + envelope-shaped `GainNode`s) — zero audio files.
- The 8-bit rule number is exposed as 8 individual toggles, so flipping one
  bit changes the next row's pattern *and* the resulting notes immediately.
- Rule, seed, tempo, and scale are encoded in the URL so a link reproduces
  the exact same visual + musical sequence.

## Features

- [x] Elementary CA engine (rule 0–255, toroidal or dead-edge boundary, seedable initial row)
- [x] Cell → scale-quantized note mapping (major / minor / pentatonic, root note)
- [x] Oscillator-based synth voice with ADSR envelope and a shared compressor
- [x] Transport: play / pause / reset, tempo control (1–12 steps/sec), mute (persisted)
- [x] Live 8-bit rule editor with instant visual + audio feedback
- [x] Curated preset rule gallery (rule 30, 90, 110, 184, ...)
- [ ] Shareable URL state (rule, seed, scale, root, tempo)
- [x] Fully static, relative-path build deployable to a subpath

See [`docs/VISION.md`](docs/VISION.md) for the full design rationale and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for the build plan.

## Stack

Vanilla JavaScript + the Web Audio API, bundled with [Vite](https://vitejs.dev/),
tested with [Vitest](https://vitest.dev/). No framework, no backend — the
production build is a single static `dist/` directory.

## Getting started

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests
npm run build    # static production build in dist/
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload |
| `npm test` | Vitest unit + DOM smoke tests |
| `npm run lint` | ESLint over the whole repo |
| `npm run build` | Static production build to `dist/` (relative paths, subpath-safe) |
| `npm run preview` | Serve the production build locally |

## License

MIT — see [`LICENSE`](LICENSE).
