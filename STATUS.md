# EvoEco sim — STATUS

**Updated:** 2026-11-17 (children at the start; starting parents value them; children eat in place with their mother)
**Verified:** never (the 2026-11-01 cold ledger audit checked ODD v0.2, not the code or v0.3)

**Stage:** Stages 1–4, 5a, 5b, 5b-cal, 5d, 5g `[ DONE ]` (tags v0.1.0–v0.9.0).
- 5h (game, multi-day trips, carrying) `[ ACTIVE ]`. Built through C4, fetch trips and learned
  gear; C5 (the winter check) and the meat-share balance remain.
- Stage 6 (households and generations) `[ ACTIVE ]`. Built except apprenticing out. The start
  state is settled: children at the start, each with a mother. Two Decided items await
  mechanisms: peer groups splitting together, and contests between bands.
- `[ PLANNED ]`: 5c (metals), 5e (containers), 5f (clearing, bread, wells, the rest of
  processing); Stages 7–9.

**State:**
- Public at https://github.com/algorithm0r/EvoEco; GitHub Pages serves `main`.
- smoke PASS @ v0.9.0-6-g5598170-dirty (pre-commit), 2026-11-17.
- Experiments follow the data protocol (EXPLOG.md): exp001–exp018 with raw results logged.
- `ODD.md`: v0.3 plus Decided and Default blocks for Stages 1–6; the Defaults await Chris's
  review.

**Metrics** (EXPLOG):
- exp012 (40 years): children at the start fill the founding age gap; births no steadier;
  population at year 40 156/73/102 (adults-only 114/72/89).
- exp015: with starting parents valuing children (0.6 norm), first-60-day child hunger deaths
  4/0/2 (exp012's start: 13/22/11).
- exp018: with children eating in place, days a weaned child is hungry beside a fed mother
  1621 → 2 (six runs); child hunger deaths 0/0/0 (fresh, 60 days) and 5/2/1 (year-10
  colonies, a year).

**Open:**
- The 8 child hunger deaths left in exp018's colonies, untraced (Chris called the leak closed).
- Winter famine: hunger deaths mostly in winter and early spring, in clusters that take men
  without children too.
- Four young men dead of thirst together (exp007 s1), untraced.
- A colony's saved parameters override current defaults on load; probes take `--set`, the
  runner does not.
- C5: do stores now hold bands in place in winter? Meat is 55–75% of food gathered.
- Women die more than men; mothers' deaths read as behaviour of the valuation (exp009–011).
- Flagged Defaults: the food-gap fade; the per-food planning priors; the rebuild forecast's
  night in the rebuilt shelter; the child's day-by-day projection; the gift loop's re-weighing;
  child drinking from weaning; care lapsing before drinking hours; minorCut 0.6; the start's
  children (0.4, spacing, random fathers); startGrownWeight 0.6 and fathers holding it; eating
  in place shared by room.

**Next action:** Trace a winter famine cluster.

**Blockers:** none.
