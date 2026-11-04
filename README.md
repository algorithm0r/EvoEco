# EvoEco

EvoEco ("evolution of economy"): an agent-based model of a pre-capital foundation economy to
which social technologies (currency through corporate capital) are added one at a time, each
judged by its effect on individual wellbeing. The model description is `ODD.md`.

A browser-based agent-based simulation (vanilla JS + Canvas, no build step), scaffolded from
the shared engine v2.

## Run
- **Browser:** http://localhost:8000/research/EvoEco/sim/ (the always-on Static Server;
  never start another server for it).
- **Headless batch:** `node runner.mjs --reps 50` — runs the same sim core in the main V8 realm
  (indirect `eval`, not `vm` — avoids vm's hot-loop tax; see `~/.claude/conventions.md` §4) and
  writes self-describing packets to MongoDB through the research Server.
- **Smoke test:** `node smoketest.mjs` — no DB; asserts the model invariant and prints metrics.

## Layout
- `src/` — sim core (`engine`, `params`, `hex`, `mapgen`, `world`, `agent`, `tree`, `planner`,
  `exchange`, `observer`, `datamanager`, `util`) + `db.js` (vendored standard DB client) +
  `ui.js`/`main.js` (browser-only, all DOM).
- `vendor/claude-basic/` — the Claude Basic sim design (0.6.0): controls, line charts,
  histograms.
- `runner.mjs` / `smoketest.mjs` — headless entry points.
- `DEVPLAN.md` / `DEVLOG.md` — the plan (forward) and the log (backward, append-only).

See `~/.claude/conventions.md` for the shared standards this follows.
