# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] - 2026-07-10

First public release, shipping as **Murmur**.

- Shareable URL state: rule, seed, scale, root, and tempo are encoded in the
  link, and a Share button copies a URL that reproduces the exact pattern and
  melody. Malformed or hostile URLs degrade to defaults instead of a blank page.
- The stage pre-fills with a silently evolved preview on load and after reset,
  so the panel shows the pattern immediately instead of an empty grid.
- Landing page and marketing pass: the servable app doubles as its own landing
  page with a wordmark, an about section, a FAQ, page/OpenGraph metadata, and a
  portfolio footer.
- Accessibility polish: 44px touch targets, focus-visible states on every
  control, `aria-label`s on icon buttons, and live-region status text.
- 124 tests green; core library at 100% line / 97% branch coverage.

## [0.1.0]

- Wow moment implemented: pressing Play draws a random rule and seed and
  starts a scrolling automaton with synchronized, scale-quantized generative
  music (`OscillatorNode` + ADSR envelope, zero audio files).
- Live 8-bit rule editor: flipping any of the 8 rule-bit toggles updates the
  displayed rule number and the next computed row/notes immediately.
- Transport: play/pause/reset and a clamped 1–12 steps/sec tempo control.
- Scale/root selectors (major/minor/pentatonic), a mute toggle persisted to
  `localStorage`, and a curated 8-rule preset gallery.
- Instrument-panel UI styled to `docs/DESIGN.md`'s modular-synth-panel
  direction: brass/cyan LEDs, bevelled panels, themed controls, responsive
  stage + control rack layout.
- Project scaffolded: elementary CA engine, static Vite build, CI, and the
  full design/vision/backlog docs. No features from the backlog are built
  yet — see `docs/BACKLOG.md`.
