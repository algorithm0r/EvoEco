# EvoEco sim — STATUS

**Updated:** 2026-11-16 (who dies: children's self-care, a hurt carer's recovery; starving mothers are behaviour)
**Verified:** never (the 2026-11-01 cold ledger audit checked ODD v0.2, not the code or v0.3)

**Stage:** Stages 1–4, 5a, 5b, 5b-cal, 5d, 5g `[ DONE ]` (tags v0.1.0–v0.9.0).
- 5h (game, multi-day trips, carrying) `[ ACTIVE ]`. Built through C4, fetch trips and learned
  gear; C5 (the winter check) and the meat-share balance remain.
- Stage 6 (households and generations) `[ ACTIVE ]`. Built except apprenticing out. The gift
  rules for children (2026-11-14/15) and children's self-care and a hurt carer's recovery
  (2026-11-16) are in. Two Decided items await mechanisms: peer groups splitting together,
  and contests between bands.
- `[ PLANNED ]`: 5c (metals), 5e (containers), 5f (clearing, bread, wells, the rest of
  processing); Stages 7–9.

**State:**
- Public at https://github.com/algorithm0r/EvoEco; GitHub Pages serves `main` at
  https://algorithm0r.github.io/EvoEco/ (loaded and drawn in the browser pane, 2026-11-15).
- smoke PASS @ v0.9.0-5-g267c629-dirty (pre-commit), 2026-11-16.
- Experiments follow the data protocol (EXPLOG.md): exp001–exp011 with raw results logged.
- `ODD.md`: v0.3 plus Decided and Default blocks for Stages 1–6; the Defaults await Chris's
  review.

**Metrics** (EXPLOG):
- exp007 (current rules, from exp002 colonies, s1 7 years / s2 10 years): no child thirst
  deaths (exp005: 13, 9); adult hunger 18, 19 (exp002 same years: 11, 3); children's hunger
  (infants included) 25, 52 (exp002: 29, 49); alive at the end 136, 112 (exp002: 145, 128).
- exp008: mothers who starve keep giving ~0.35 a day while their level falls to −4; against
  camp peers they gather less, hold no stores, have more children and fewer hours.
- exp009–011: no counterfactual of the gift sum (her hunger kept, the child's real inflow, her
  death priced with dependents) stops the gift paying.

**Open:**
- The start state: a hand-designed balanced age profile or a burn-in (Chris's call).
- Winter famine: hunger deaths mostly in winter and early spring, in clusters that take men
  without children too.
- Four young men dead of thirst together (exp007 s1), untraced.
- A colony's saved parameters override current defaults on load; probes take `--set`, the
  runner does not.
- C5: do stores now hold bands in place in winter? Meat is 55–75% of food gathered.
- Women die more than men; mothers' deaths read as behaviour of the valuation (exp009–011).
- Flagged Defaults: the food-gap fade; the per-food planning priors; the rebuild forecast's
  night in the rebuilt shelter; the child's day-by-day projection; the gift loop's re-weighing;
  child drinking from weaning; care lapsing before drinking hours; minorCut 0.6.

**Next action:** Ask Chris for the start-state call; meanwhile trace a winter famine cluster.

**Blockers:** none.
