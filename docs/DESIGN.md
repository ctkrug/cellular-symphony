# Design

## 1. Aesthetic direction

**Cellular Symphony is a modular synth panel:** a brushed dark-aluminum
instrument face, warm brass/amber LEDs for live state, and a cyan secondary
LED for audio activity — screw-head rivets at the panel corners, monospace
readouts for the rule number and BPM like a hardware sequencer's digit
display. It reads as an instrument you'd find bolted into a Eurorack case,
not a web app. This sits deliberately away from generic "dark gray cards"
territory and away from the flatter terminal-mono / CRT-glow palette family
used by other recent visual toys in the portfolio — the panel-depth and
brass/cyan combination is its own family.

## 2. Tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#14161a` | page background (brushed panel base) |
| `--surface-1` | `#1c1f26` | primary panel surface (stage, cards) |
| `--surface-2` | `#24282f` | raised surface (buttons, toggles, knobs) |
| `--text` | `#e8e6df` | primary text (warm off-white, not pure #fff) |
| `--text-muted` | `#8b8f99` | secondary labels, captions |
| `--accent` | `#f2a93b` | brass/amber — live cells, primary LED, active state |
| `--accent-2` | `#3ddad0` | cyan — audio/waveform activity, secondary LED |
| `--success` | `#6fcf7d` | confirmations (e.g. "link copied") |
| `--danger` | `#e2574c` | errors, invalid rule/seed input |

**Type pairing:** display font **Space Grotesk** (wordmark, section
headings — geometric but a little mechanical, fits an instrument face) +
UI/mono font **JetBrains Mono** (rule number readout, BPM, labels, body
copy) — both via Google Fonts with `system-ui`/`monospace` fallbacks.

**Spacing:** 8px base unit (8/16/24/32/48/64).

**Corner radius:** 8px for panels/cards; circular (50%) for knobs, LEDs, and
the 8 rule-bit toggles (they should read as physical switches, not checkboxes).

**Shadow/glow:** panels get a layered shadow (`0 1px 0 rgba(255,255,255,.04)
inset` top highlight + `0 8px 24px rgba(0,0,0,.5)` drop) for a bevelled,
bolted-down feel. Active LEDs (live cell, playing state) get a soft
`box-shadow` glow in their color (`0 0 8px var(--accent)`).

**Motion:** UI transitions 160ms ease-out; a rule-bit toggle flip and its
resulting row redraw complete within 90ms so the "nudge and hear it" moment
feels instant, not laggy.

## 3. Layout intent

The **automaton stage** (the scrolling grid) is the hero: on 1440×900 desktop
it occupies the left ~65% of the viewport as a tall panel, with a narrower
right-hand control rack (rule toggles, transport, scale/root/tempo, preset
gallery) styled as a stacked module strip — mirroring how a real modular
synth case puts the patch/sequencer module front-and-center with utility
modules beside it. On 390×844 phone, the stage stacks full-width on top
(≥55vh) with the control rack below it as a scrollable panel; nothing is
squeezed into a fixed pixel box.

## 4. Signature detail

A **boot sequence**: on first load, the 8 rule-bit LEDs light up brass one at
a time (staggered ~60ms) before settling into the current rule's pattern,
like powering on a hardware module — this doubles as the page's loading
state instead of a blank flash. A thin cyan waveform readout beneath the
stage pulses in sync with triggered notes as a constant reminder that sound
and pattern are the same event.

## 5. Juice plan

- **Movement:** each new automaton row slides in from the top over ~100ms
  (not an instant jump-cut) so the scroll reads as continuous motion.
- **Impact feedback:** a triggered cell flashes brighter for one frame and
  its column's rule-bit LED (if that neighborhood is currently live) pulses
  in sync — visible proof of which rule bit produced which note.
- **Goal/success feedback:** copying a share link or loading a curated
  preset gives a brief cyan flash + "copied"/"loaded" toast near the control
  that triggered it.
- **Celebration moment:** there's no "win," but selecting a preset rule
  triggers a one-off arpeggio flourish across the current scale as the new
  pattern seeds in, so every preset change has its own small musical sting.
- **Synth SFX list (WebAudio-synthesized, no audio files):**
  - `step` — the per-row note(s) mapped from live cells (sine/triangle
    oscillator, ~120ms envelope).
  - `toggle` — a short high-passed click when a rule-bit switch is flipped.
  - `preset-load` — a quick ascending 3-note arpeggio in the current scale.
  - `mute-toggle` — a soft low thump distinguishing mute on/off.
  - All routed through a shared master gain → mute toggle whose state
    persists in `localStorage`; `AudioContext` is created lazily on first
    user gesture per browser autoplay policy.
- Respects `prefers-reduced-motion`: row slide-in and LED pulses drop to an
  instant redraw, audio and rule logic unaffected.
