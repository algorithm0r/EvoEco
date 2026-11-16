# EvoEco sim — STATUS

**Updated:** 2026-11-15 (game, carrying and gear; data protocol; child gifts fixed)
**Verified:** never (the 2026-11-01 cold ledger audit checked ODD v0.2, not the code or v0.3)

**Stage:** Stages 1–4, 5a, 5b, 5b-cal, 5d, 5g `[ DONE ]` (tags v0.1.0–v0.9.0).
- 5h (game, multi-day trips, carrying) `[ ACTIVE ]`. Built through C4, fetch trips and learned
  gear; C5 (the winter check) and the meat-share balance remain.
- Stage 6 (households and generations) `[ ACTIVE ]`. Built except apprenticing out. The gift
  rules for children were rebuilt 2026-11-14/15. Two Decided items await mechanisms: peer
  groups splitting together, and contests between bands.
- `[ PLANNED ]`: 5c (metals), 5e (containers), 5f (clearing, bread, wells, the rest of
  processing); Stages 7–9.

**State:**
- smoke PASS @ v0.9.0-2-gfefbe89-dirty (pre-commit), 2026-11-15. Planner 1.692 ms per
  agent-day (machine shared).
- Experiments follow the data protocol (CLAUDE.md, EXPLOG.md): exp001–exp004 done with raw
  results logged; exp005 running.
- The browser view is unchecked since 2026-11-06.
- `ODD.md`: v0.3 plus Decided and Default blocks for Stages 1–6; the Defaults await Chris's
  review.

**Metrics** (EXPLOG):
- exp004, the two gift rules from exp002 colonies: child-days in food deficit 91,475 → 1,062
  (s1, 7 years) and 130,165 → 3,331 (s2, 10 years).
- Same spans against exp002: children's hunger deaths 15 vs 29 (s1), 47 vs 49 (s2); thirst 13
  vs 5, 9 vs 4; adults at the end 76 vs 87, 56 vs 80.
- exp002: from 100 adults and no children, the founding cohort's age gap persists 40 years.

**Open:**
- Fewer adults and more child thirst deaths under the new gift rules (exp004, one run per
  seed); exp005 counts every death by cause and age.
- The start state: a hand-designed balanced age profile or a burn-in (Chris's call).
- C5: do stores now hold bands in place in winter? Meat is 55–75% of food gathered.
- Winter huts: nobody sleeps in a hut in winter (2026-11-11 colony); untested since carrying.
- Women die more than men; should a woman's return on a child count the risk to her?
- Flagged Defaults: the food-gap fade; the per-food planning priors; the rebuild forecast's
  night in the rebuilt shelter; the child's day-by-day projection; the gift loop's re-weighing.

**Next action:** Read exp005 (`results/exp005_deaths/`) when both runs finish and log its raw
results in EXPLOG.

**Blockers:** none.
