# EvoEco sim — STATUS

**Updated:** 2026-11-11 (camp forecast prices crowding, rebuilding and a site's land)
**Verified:** never (the 2026-11-01 cold ledger audit checked ODD v0.2, not the code or v0.3)

**Stage:** Stages 1–4, 5a, 5b, 5b-cal, 5d, 5g `[ DONE ]` (tags v0.1.0–v0.9.0).
- Stage 6 (households and generations) `[ ACTIVE ]`. Built except apprenticing out. Two
  Decided items await mechanisms: peer groups splitting together, and contests between bands.
- `[ PLANNED ]`: 5c (metals), 5e (containers), 5f (clearing, bread, wells, the rest of
  processing).

**State:**
- *Since v0.9.0:* the Stage 6 life cycle, trust, planning together, spin-up with colony save
  and reload, staggered first conceptions, leaving a camp that stays, roots at 2000 per land;
  and (2026-11-10) crowding, rebuilding and the site's own land in the camp forecast.
- smoke PASS @ v0.9.0-1-g29c9bd4-dirty (pre-commit), 2026-11-11. Bands year: 101/100 alive, 1,445 trades, 11,646 gifts, 623 trusted ties, 72 discoveries, 10 conceptions, 245 camp moves, 155 joins; solitary 8/8. Planner 0.599 ms per agent-day (was 0.413; machine busy, untimed clean).
- The browser view is unchecked since 2026-11-06 (the :8000 server did not answer).
- `ODD.md`: v0.3 plus Default blocks for Stages 1–6, not reviewed by Chris.

**Metrics** (bands, scratchpad runs, one per seed, 2026-11-11):
- 40 years, seeds 1–6, alive at year 40: with tech mean 345 (150–452), no tech mean 369
  (290–498). The old code with tech: mean 156 (58–213).
- Return on tech at year 8: 0.5 h a day more work than no tech for the same food (1.91 vs
  1.93 days' worth); warmth 0.80 vs 0.72.
- Camp moves ~45 per 100 people a year; returns to a standing empty hut 10–76 a year.

**Open:**
- Winter: nobody sleeps in a hut in winter (seed 3 tech colony, year 40), and new huts are
  begun while finished ones stand. The shortlist ranks sites by land alone, so a hut site is
  weighed only when its land is top 5. Untested.
- Tech buys warmth but no food.
- Seed 6 with tech lost 50 to hunger in year 40; untraced.
- Stage 6 Done-when is half met. A population persists 40 years without scaffolding. "Several
  generations" needs 60+ years, and households forming and dissolving is not measured.
- The all-adult start drives early famines; Chris proposed a balanced demographic start.
- Women die more than men. Open question to Chris: should a woman's return on a child count
  the risk to her?
- Flagged Defaults: the lethal-night cost; the food-gap fade; the per-food planning priors;
  the rebuild forecast's night in the rebuilt shelter. The Stage 1–6 Defaults await Chris's
  review.

**Next action:** Run `winterprobe.mjs` (scratchpad) on the seed-3 tech colony: per winter
camp decision, the hut sites in reach, whether any is shortlisted, and their cost against
staying.

**Blockers:** none.
