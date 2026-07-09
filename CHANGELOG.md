# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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
