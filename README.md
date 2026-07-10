# Murmur

**▶ Live demo: [apps.charliekrug.com/cellular-symphony](https://apps.charliekrug.com/cellular-symphony/)**

[![CI](https://github.com/ctkrug/cellular-symphony/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/cellular-symphony/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-c9a227.svg)](LICENSE)

Watch simple rules turn into music. Murmur runs an elementary cellular
automaton (Wolfram's rules 0 to 255) and plays it as it evolves: each new row
of cells is drawn top to bottom like a piano roll, and the instant a row is
computed, every live cell in it triggers a note. The pattern you see scrolling
down and the melody you hear are the same event, in sync, the whole time.

Flip a single bit of the rule and both the picture and the music change on the
next row, with no restart. That cause and effect between what is on screen and
what is in your ears is the part most generative-music toys leave out.

## Who it's for

Generative-music tinkerers and creative coders who like a browser toy they can
play with in ten seconds and share with a link. No account, no install, and a
sound plays on your very first click.

## Try it

1. Open the [live demo](https://apps.charliekrug.com/cellular-symphony/).
2. Press **Play**. A random rule starts scrolling and a melody plays in sync.
3. Flip any of the 8 rule-bit switches and hear the pattern change immediately.
4. Pick a **scale**, **root**, and **tempo**; try a preset like rule 90 or 110.
5. Hit **Share** to copy a link that reproduces your exact pattern and melody.

## How it works

- A **1D elementary cellular automaton** advances one row per tempo tick,
  rendered top-to-bottom like a scrolling piano roll.
- Each column maps to a **scale degree** (major / minor / pentatonic, with a
  configurable root), so live cells trigger notes. Quantising to a scale is
  what keeps even chaotic rules like rule 30 listenable instead of noisy.
- Notes are synthesised entirely with the **Web Audio API** (`OscillatorNode`
  plus an envelope-shaped `GainNode`, summed through a compressor). Zero audio
  files.
- The 8-bit rule number is exposed as **8 individual switches**, so flipping one
  bit changes the next row's pattern *and* its notes the moment you click.
- Rule, seed, scale, root, and tempo are encoded in the **URL**, so a link
  reproduces the exact same visual and musical sequence on any device.

## Features

- Elementary CA engine (rule 0–255, toroidal or dead-edge boundary, seedable row)
- Cell → scale-quantised note mapping (major / minor / pentatonic, any root)
- Oscillator synth voice with an ADSR envelope and a shared compressor
- Transport: play / pause / reset, tempo (1–12 steps/sec), mute (persisted)
- Live 8-bit rule editor with instant visual and audio feedback
- Curated preset gallery (rule 30, 90, 110, 184, and more)
- Shareable URL state with a one-click copy-link button
- Fully static, relative-path build deployable to a subpath

## Stack

Vanilla JavaScript and the Web Audio API, bundled with
[Vite](https://vitejs.dev/) and tested with [Vitest](https://vitest.dev/). No
framework and no backend; the production build is a single static directory.

## Getting started

```bash
npm install
npm run dev      # local dev server
npm test         # unit + DOM smoke tests
npm run build    # static production build in dist/
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload |
| `npm test` | Vitest unit + jsdom smoke tests |
| `npm run coverage` | Test run with a coverage report |
| `npm run lint` | ESLint over the whole repo |
| `npm run build` | Static production build to `dist/` (relative paths, subpath-safe) |
| `npm run preview` | Serve the production build locally |

## Documentation

- [`docs/VISION.md`](docs/VISION.md): the design rationale and core idea.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): module map and data flow.
- [`docs/DESIGN.md`](docs/DESIGN.md): visual direction and tokens.

## License

MIT. See [`LICENSE`](LICENSE).

---

More of Charlie's projects → [apps.charliekrug.com](https://apps.charliekrug.com)
