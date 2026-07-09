# Backlog

Stories are marked `[ ]` until built. Every story lists concrete, checkable
acceptance criteria — no vibes-based criteria. Story 1 is the wow moment and
must land before anything else.

## Epic 1 — Core wow moment: automaton + synced audio playback

- [ ] **Story 1 (wow moment): random rule auto-plays in sync on first Play**
  - Loading the page and clicking a single Play control starts a random
    elementary CA rule scrolling AND the first audible note fires within
    100ms of the row that triggered it (no perceptible lag between visual
    row and its sound).
  - Each newly computed row triggers exactly one set of audio "read" events
    for that row — no double-triggering and no silent gap longer than one
    row at the current tempo.
  - Reloading the page selects a new random rule and seed each time (two
    consecutive loads do not reproduce the same initial row).

- [ ] **Story 2: rule-bit toggle nudges both visual and audio live**
  - Toggling any of the 8 rule-bit switches while playing changes the next
    computed row's pattern within one step, with no restart required.
  - A unit test asserts that flipping a bit changes both the computed next
    row and its mapped notes for a controlled before/after rule.
  - The displayed rule number (0–255) updates immediately on toggle.

- [ ] **Story 3: elementary CA engine is correct and isolated**
  - Given rule 30 and a fixed single-cell seed row, the next N rows match a
    precomputed reference sequence (unit test).
  - Edges wrap toroidally by default; boundary mode is a parameter, not
    hardcoded.
  - The engine module has no DOM or Web Audio dependency and is importable
    standalone for unit testing (already true of `src/lib/automaton.js`).

## Epic 2 — Musical mapping and audio engine quality

- [ ] **Story 4: cell-to-note mapping quantized to a musical scale**
  - Given a scale (major / minor / pentatonic) and root note, the mapping
    function returns only pitches within that scale for every live column
    (unit test enumerates all columns for each scale).
  - Changing scale or root note while playing takes effect on the next row
    without overlapping unreleased notes or audio glitches.

- [ ] **Story 5: oscillator-based synth voice with ADSR envelope**
  - The audio module contains zero references to audio file assets
    (`.mp3`/`.wav`/`.ogg`) — verifiable by grep.
  - Each triggered note ramps gain up then down rather than clicking on/off:
    a unit test on the envelope function asserts gain starts at ~0, rises,
    then decays back to ~0 by the release end.
  - A shared master gain feeds a limiter/compressor so simultaneous notes
    never clip above 0dBFS.

- [ ] **Story 6: tempo and play/pause/reset transport**
  - Play starts stepping at the selected tempo; Pause halts stepping and all
    audio scheduling immediately (no notes fire after pause).
  - Reset re-seeds the top row and clears the stage without a page reload.
  - Tempo is clamped to 1–12 steps/sec in code (not only via the UI control).

- [ ] **Story 7: mute toggle persists across reloads**
  - Toggling mute sets master gain to 0 without pausing the simulation or
    visuals.
  - Mute state is written to `localStorage` and restored on next load.

## Epic 3 — Shareability, presets, and design polish

- [ ] **Story 8: URL-encoded state for sharing**
  - Loading a URL with `?rule=90&seed=...&scale=pentatonic&root=A`
    reproduces the exact same visual pattern and note sequence
    deterministically (unit test on the parse/serialize round-trip).
  - Changing a control updates the URL via `history.replaceState` — no full
    reload, no history spam per keystroke/drag.

- [ ] **Story 9: curated preset rule gallery**
  - At least 6 curated rules (e.g. 30, 90, 110, 184, 60, 150) are selectable
    from a preset picker, each with a short human-readable label.
  - Selecting a preset immediately loads that rule and restarts playback
    from a fresh seed.

- [ ] **Story 10: design polish pass**
  - The built page matches `docs/DESIGN.md`'s direction and tokens: fonts
    loaded, brass/cyan accents applied, panel depth/shadow present (verified
    manually in QA and noted in the STATUS `memory` field).
  - Responsive and composed at 390px, 768px, and 1440px widths — no
    horizontal scroll, no overlap, no dead empty margins.
  - A custom favicon and designed wordmark are present (not the default
    globe icon), verified by file presence and visual check.

## Epic 4 — Reliability and deployability

- [ ] **Story 11: unit test suite runs in CI**
  - `npm test` runs headlessly in GitHub Actions and exits 0 on a clean
    checkout.
  - Coverage includes at minimum: the rule-30 reference sequence, scale
    quantization, and mute-persistence logic.

- [ ] **Story 12: static build is fully relative-path and subpath-deployable**
  - `npm run build` produces `dist/` whose `index.html` references all
    assets via relative paths only (no leading `/`) — verified by grepping
    the build output for `href="/` / `src="/"`.
  - Opening `dist/index.html` (or serving it from an arbitrary subpath)
    loads with no console errors and both visuals and audio function.

- [ ] **Story 13: accessibility and reduced-motion pass**
  - `prefers-reduced-motion` disables continuous row slide-in and LED pulse
    animation while keeping the simulation and audio fully functional
    (manually verified in QA).
  - Every interactive control is reachable and operable via keyboard, with a
    visible focus state on each.
