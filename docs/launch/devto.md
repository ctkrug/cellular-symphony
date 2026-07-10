---
title: "Murmur: turning a cellular automaton into music you can hear"
published: false
tags: javascript, webaudio, generativeart, showdev
---

I built a little browser toy called [Murmur](https://apps.charliekrug.com/cellular-symphony/).
It runs an elementary cellular automaton and plays it as music while it evolves.
No samples, no backend, no login. Press play and a random rule starts scrolling
down the screen while a melody plays in time with it.

The idea came from a small frustration. Cellular automata are one of the best
"complex behaviour from a simple rule" demos there is, but the famous ones
mostly live as static posters. Generative music tools are fun too, but they tend
to be a wall of knobs where you cannot point at the thing making a given note.
I wanted one toy where the picture and the sound are the exact same event, so
that flipping one bit of a rule changes both at once and you can hear the
difference.

## The one decision that made it work: quantise everything

My first version mapped a cell's column directly to a frequency. It sounded
awful. Rule 30 is chaotic, and chaos mapped straight to pitch is just noise.

The fix was to stop thinking in frequencies and start thinking in scale degrees.
Instead of `column -> Hz`, I map `column -> nth note of the selected scale`, then
convert that scale degree to a frequency:

```js
export function noteForColumn(column, width, { scale = 'major', root = 'C' } = {}) {
  const notes = scaleNotes(scale, root, 3); // MIDI numbers across 3 octaves
  const index = Math.min(notes.length - 1, Math.floor((column / width) * notes.length));
  return midiToFrequency(notes[index]);
}
```

Once every possible note is a member of a real scale, even the chaotic rules
sound like music. Rule 30 becomes a restless, arpeggiated thing instead of a
mess. This one change is the difference between the toy being annoying and being
something you want to keep poking at.

## The second decision: sonify on compute, not on a clock

A tempting way to build this is to run the automaton on one loop and the audio on
another. That drifts. The row you hear stops matching the row you see.

So there is only one loop. When a row is computed, that same function call also
fires the notes for the live cells in it:

```js
function step() {
  const next = nextRow(state.rule, state.row);
  state.row = next;
  state.rows.unshift(next);
  draw();
  playNotesForRow(next); // same tick that produced the row
}
```

There is no separate audio clock to fall out of sync with. The visual and the
sound cannot drift because they are the same event.

## Sharing without a database

I wanted people to be able to send a pattern they found. A database felt like
overkill for a static toy, so the entire shareable state (rule, seed, scale,
root, tempo) lives in the URL. The seed deterministically expands into the
initial row through a small seeded PRNG, so a link always reproduces the exact
same picture and the exact same sequence of notes. The parser is deliberately
strict and forgiving at once: a hand-edited or hostile URL drops any invalid
field and falls back to a sane default instead of showing a blank page.

That single choice also made the whole thing easy to test. Because the state is
pure data and the automaton is deterministic, the core logic has no DOM or audio
in it and sits at 100% line coverage. The Web Audio wiring is a thin layer on
top that a jsdom smoke test drives.

## What I would do differently

The timbre is currently a single sine oscillator. It is clean but a bit plain
after a while. The obvious next step is to let automaton state shape the sound
itself, for example mapping a cell's live-neighbour count to a filter cutoff, so
denser regions sound brighter. That closes the loop even further: the rule would
drive not just which notes play but how they sound.

If you want to try it, it is here: <https://apps.charliekrug.com/cellular-symphony/>
and the source is on [GitHub](https://github.com/ctkrug/cellular-symphony).
I would love to know which rule sounds best to you.
