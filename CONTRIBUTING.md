# Contributing

This is a solo side project, but issues and PRs are welcome.

- Read `docs/VISION.md` and `docs/BACKLOG.md` first — new features should
  trace back to a backlog story (or propose a new one) rather than drift
  from the core idea.
- UI/visual changes should follow `docs/DESIGN.md`'s tokens and direction.
- Run `npm run lint && npm test && npm run build` before opening a PR; CI
  runs the same three commands.
- Keep audio synthesis oscillator-based — no binary audio assets.
