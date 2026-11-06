# EvoEco sim — STATUS

**Updated:** 2026-11-06 (5g closed, v0.9.0; Stage 6 build starting)
**Verified:** never (the 2026-11-01 cold ledger audit checked ODD v0.2, not the code or v0.3)

**Stage:** Stages 1–4, 5a, 5b, 5b-cal, 5d, 5g `[ DONE ]` (tags v0.1.0–v0.9.0). Stage 6
(households and generations) `[ ACTIVE ]`, design walked, build starting. 5c (metals), 5e
(containers) and 5f (clearing, bread, wells, the rest of processing) `[ PLANNED ]`.

**State:**
- World, agents, bands, chat, norms, barter over any goods, gifts, ties, belonging, stone
  tools, pots, huts, tinkering, know-how by seeing, farming, moving camp, shared huts, habit
  and norm. Since 5g: a hex's land is shared by grass, roots, trees and fields, with
  succession; four wild foods by season (greens, seeds, nuts, roots); drying, roasting and
  grinding as know-how; starting know-how is a setting, default no tech level.
- Smoke PASS, all checks @ v0.9.0, 2026-11-06. The bands year kept 92/100 alive with no
  winter floor.
- The view at http://localhost:8000/research/EvoEco/sim/ loads with no console errors and
  the cover and held charts (checked 2026-11-06).
- `ODD.md` is v0.3 plus Default blocks for Stages 1–5g (not reviewed by Chris).

**Metrics** (bands, seed 1):
- Three years: 82/100 alive; deaths 8, 1, 9, all at winter's end.
- Processing batches: year 2 drying 128, grinding 155, roasting 52; year 3 1,052 / 949 / 78.
- Roots cover 0.21 → 0.165 and trees 0.354 → 0.302 over three years.
- 2.53 ms per agent-day. Camp weighing was 45% of run time at 5d (not re-measured).

**Branches:** `main` only, local; no remote.

**Open:**
- Late-winter deaths; roots and trees declining under use (Backlog, watch).
- Run-to-run variation limits reading results; no multi-seed measure yet.
- ODD Open: does a norm include its own observations (§4.4)?
- Flagged Defaults: the lethal-night cost; the food-gap fade; the per-food planning priors.
  The Stage 1–5g Defaults await Chris's review. Citations unchecked.

**Next action:** Stage 6 build, in DEVPLAN order: cheaper camp weighing, trust, spin-up,
sexes and childhood, care, conception, planning together.

**Blockers:** none.
