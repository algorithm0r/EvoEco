# EvoEco sim — STATUS

**Updated:** 2026-11-09 (Stage 6 built except apprenticing; 40-year runs persist)
**Verified:** never (the 2026-11-01 cold ledger audit checked ODD v0.2, not the code or v0.3)

**Stage:** Stages 1–4, 5a, 5b, 5b-cal, 5d, 5g `[ DONE ]` (tags v0.1.0–v0.9.0).
- Stage 6 (households and generations) `[ ACTIVE ]`. Everything is built except apprenticing
  out.
- `[ PLANNED ]`: 5c (metals), 5e (containers), 5f (clearing, bread, wells, the rest of
  processing).

**State:**
- *Since v0.9.0:*
  - Sexes, pregnancy, nursing, childhood stages, care from rest hours, old-age care as gifts.
  - Monthly conception on both parents' return.
  - Trust; planning together.
  - Spin-up with colony save and reload.
  - Staggered first conceptions; leaving a camp that stays.
  - Roots at 2000 per land.
- Smoke PASS @ v0.9.0-dirty (pre-commit), 2026-11-07. The bands year keeps 101/100 alive.
- The browser view is unchecked since 2026-11-06 (the :8000 server did not answer).
- `ODD.md`: v0.3 plus Default blocks for Stages 1–6, not reviewed by Chris.

**Metrics** (bands; scratchpad runs, one per seed):
- 40 years, seeds 1–3: 193 / 162 / 115 alive.
  - The second generation matured (90 / 84 / 92) and bears.
  - Famines at years 9–10 killed 22–27 children in each seed.
  - Women are 37 / 34 / 21 of 94 / 77 / 73 adults.
- 20 years: 124 / 96 / 128 (was 18 / 25 / 41 before roots ×2).
- Smoke planner: 0.413 ms per agent-day. Bands runs: 1.3–2.4 ms.

**Branches:** `main` only, local; no remote.

**Open:**
- Stage 6 Done-when is half met. A population persists 40 years, two generations, without
  scaffolding. "Several generations" needs 60+ years. Whether households form and dissolve
  is not yet measured.
- The all-adult start drives the year 9–10 famines. Chris proposed a balanced demographic
  start (2026-11-09).
- Women die more than men, and seed 3 has 1–6 births a year. Open question to Chris: should
  a woman's return on a child count the risk to her?
- Run-to-run variation; no multi-seed measure yet.
- Flagged Defaults: the lethal-night cost; the food-gap fade; the per-food planning priors.
  The Stage 1–6 Defaults await Chris's review. Citations unchecked.

**Next action:** Design the balanced starting demographic, against the §4.2 ledger. Then
build apprenticing out.

**Blockers:** none.
