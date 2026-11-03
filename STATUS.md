# EvoEco sim — STATUS

**Updated:** 2026-11-03 (calibration closed)
**Verified:** never (the 2026-11-01 cold ledger audit checked ODD v0.2, not the code or v0.3)

**Stage:** Stages 1–4, 5a, 5b and 5b-cal `[ DONE ]`. Next: 5d (farming, bread, wells; harvest
settled) or 5c (metals). Both `[ PLANNED ]`.

**State:**
- World, agents, bands, meeting, chat, norms, barter over any goods, gifts, ties, belonging,
  stone tools, clay, pots, huts as multi-day builds, tinkering, know-how learned by seeing.
  The Keep projection runs on lived seasonal inflows. Smoke PASS, all 36 checks @ calibration
  commit, 2026-11-03.
- `ODD.md` v0.3 plus Default blocks for Stages 1–5b and the calibration (not reviewed by Chris).

**Metrics:** bands, seed 1, two years: 87/100 alive, 13 hunger deaths all in year 1, none of
thirst; projected vs lived food within ~0.3 a day. With the hut known: 56 huts by day 240,
winter warmth 0.71 (0.56 without). Price of wood 1.42 / 0.62 / 0.55 food at 2:8 / 5:5 / 8:2.
Planner 0.69 ms per agent-day in bands runs (~30 min per generation at 300 agents).

**Branches:** `main` only, local; no remote.

**Open:**
- Two flagged Defaults for Chris: the lethal-night cost; the half-per-week fade of a food gap.
- First barter now on day 49, not day 3 (Backlog: check why).
- Route search still misses some drinking plans (harmless now; Backlog).
- Stage 1–5b Defaults await Chris's review; numbers provisional. Citation check.

**Next action:** 5d farming, with the planter's return counting what comes back through others.

**Blockers:** none.
