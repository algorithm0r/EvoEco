# EvoEco sim — STATUS

**Updated:** 2026-11-02 (Stage 1 closed)
**Verified:** never (the 2026-11-01 cold ledger audit checked ODD v0.2, not the code or v0.3)

**Stage:** Stage 1 `[ DONE ]`; Stage 2 (one agent alive) next, `[ PLANNED ]`, not started.

**State:**
- The world runs: seeded hex map (64 × 48; plains, forest, hills, rivers, lakes), springs,
  deposits, one resource mechanism, seasons, terrain-weighted travel hours, fixed-map export.
  Smoke PASS (13 checks) @ Stage 1 commit, 2026-11-02. Drawn in the browser with terrain and
  resource layers; no console errors.
- No agents yet. `runner.mjs` updated for the world but not run (needs the DB).
- `ODD.md` v0.3 plus a Stage 1 Default block (map choices). Defaults from this session are
  not cold-checked.

**Metrics:** terrain plains 46.9 / forest 25.5 / hills 21.6 / river 2.0 / lake 4.0 %;
tin–copper 25 hexes; world.update 0.08 ms/day; 40 hexes within 4 h of a central plains hex.

**Branches:** `main` only, local; no remote.

**Open:**
- Numbers are first guesses (plants regrow ~95% in a season; water in ~6% of hexes).
- Citation check (Backlog). Output measures and run comparison: later research.

**Next action:** Stage 2: needs, hour budget, route planner, habits, aging and death; measure
planner cost per agent-day.

**Blockers:** none.
