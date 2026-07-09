# Vision

## The problem

Elementary cellular automata are one of the most legible "complex system from
a simple rule" demos there is — a single 8-bit number produces everything
from stable order to genuine chaos, and you can see the whole rule at a
glance. Generative music systems are also compelling, but almost always
decouple the thing making the sound from the thing you're looking at: a
visualizer reacts to audio, or a sequencer drives an abstract waveform, but
you can't point at the *cause* of a specific note the way you can point at a
specific cell. Cellular Symphony removes that decoupling: the automaton *is*
the score. Every note traces back to a specific, visible cell, and every rule
change is audible in the same breath it's visible.

## Who it's for

People who like generative art / demoscene-adjacent toys, people curious
about cellular automata who've only seen static rule-30 posters, and anyone
who wants a "hit play, immediately get something musical" experience rather
than a parameter-heavy synth patcher. No account, no install, no explanation
required before the first sound plays.

## The core idea

A 1D elementary cellular automaton (Wolfram rule 0–255) advances one row per
tempo tick and renders top-to-bottom, like a scrolling piano roll or an
oscilloscope trace. Each column index maps to a scale degree in a chosen
musical scale and root note; whenever a cell in the newly computed row is
alive, its column's note is triggered via a Web Audio oscillator with a short
envelope. The automaton doesn't just look like it's "playing" — the rows
scrolling past *are* being played, in the order they're computed.

## Key design decisions

- **Sonify on compute, not on a separate clock.** Each new row's note events
  fire the instant that row is calculated, so there is no drift between the
  visual scroll and the audio — they are the same event.
- **Musical quantization is the trick that makes this work.** An unquantized
  mapping of "cell index → frequency" turns almost any rule into noise. By
  constraining every triggered note to a chosen scale (major / minor /
  pentatonic) and root note, arbitrary rules — even chaotic ones like rule
  30 — stay listenable, which is what makes "nudge a rule bit, hear it
  shift" a *pleasant* experience instead of a grating one.
- **Zero samples, all synthesis.** Every sound is an `OscillatorNode` shaped
  by a `GainNode` envelope (plus a shared reverb/delay bus for lushness).
  This keeps the repo dependency-free and means the timbre itself can react
  to automaton state (e.g. neighbor count → filter cutoff) later without
  needing new assets.
- **The rule is the primary control surface.** Rather than a wall of sliders,
  the 8 bits of the rule number are exposed as 8 toggles corresponding to
  each of the 8 possible 3-cell neighborhoods. Flipping one bit is the single
  interaction that most directly demonstrates "small change in rule, visible
  and audible change in outcome."
- **State lives in the URL.** Rule, seed, tempo, scale, and root note are
  encoded as query params so a link reproduces the exact pattern and melody
  — sharing a "sound" is sharing a URL, not describing settings.
- **Deterministic seeding.** The initial row is derived from a seed value
  (not raw `Math.random()` at render time) so the same seed always produces
  the same first row, which is what makes shareable URLs and reference-based
  tests possible.

## What "v1 done" looks like

Landing on the page and pressing a single Play control starts a random rule
scrolling while a musical, evolving melody plays in sync within the same
tick. Flipping any of the 8 rule-bit toggles changes the next row's pattern
and its notes immediately, with the rule number displayed and updating live.
Tempo, scale, and root note are adjustable without audio glitches; mute is a
single control whose state survives a reload. At least half a dozen curated
"good" rules are one click away for people who don't want to hunt for a
listenable rule themselves. The production build is a single static
directory using only relative asset paths, so it can be dropped at
`apps.charliekrug.com/cellular-symphony` (a subpath) with no server-side
changes.
