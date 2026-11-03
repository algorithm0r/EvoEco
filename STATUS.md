# EvoEco sim — STATUS

**Updated:** 2026-11-03 (5d part 1, farming, built)
**Verified:** never (the 2026-11-01 cold ledger audit checked ODD v0.2, not the code or v0.3)

**Stage:** Stages 1–4, 5a, 5b, 5b-cal `[ DONE ]`. 5d (farming, bread, wells) `[ ACTIVE ]`:
farming built; bread, wells and clearing forest left. 5c (metals) `[ PLANNED ]`.

**State:**
- World, agents, bands, chat, norms, barter over any goods, gifts, ties, belonging, stone tools,
  pots, huts, tinkering, know-how by seeing, and farming. Fields are reaped by anyone. The
  planter's return counts grain given back by those who reaped its field. The Keep projection
  reaches a year. Smoke PASS, all 39 checks @ 5d part 1 commit, 2026-11-03.
- `ODD.md` v0.3 plus Default blocks for Stages 1–5d (not reviewed by Chris).

**Metrics:** bands, seed 1, three years, nothing given: farming found on day 100, first
sowing in year 3 (31 seeds → 274 grain), 83/100 alive. With farming known: 115 seeds → 1,032
grain in year 3, winter food 0.98–0.99. Planner ~1.6 ms per agent-day in bands runs (~70 min per
generation at 300 agents).

**Branches:** `main` only, local; no remote.

**Open:**
- Two flagged Defaults for Chris: the lethal-night cost; the half-per-week fade of a food gap.
- Farming takes about three years to start from nothing (seed held through winter).
- Return through others is tiny so far.
- Planner cost rose with the year-long projection (Backlog perf).
- Stage 1–5d Defaults await Chris's review; numbers provisional. Citation check.

**Next action:** 5d part 2: bread (quern, clay oven), wells, clearing forest for fields.

**Blockers:** none.
