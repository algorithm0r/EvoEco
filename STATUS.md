# EvoEco sim — STATUS

**Updated:** 2026-11-04 (5d closed; Stage 6 active, design first)
**Verified:** never (the 2026-11-01 cold ledger audit checked ODD v0.2, not the code or v0.3)

**Stage:** Stages 1–4, 5a, 5b, 5b-cal, 5d `[ DONE ]` (tags v0.1.0–v0.8.0). Stage 6 (households
and generations) `[ ACTIVE ]`, brought forward by Chris on 2026-11-04. 5c (metals), 5e
(containers) and 5f (clearing, bread, wells) `[ PLANNED ]`.

**State:**
- World, agents, bands, chat, norms, barter over any goods, gifts, ties, belonging, stone
  tools, pots, huts, tinkering, know-how by seeing, and farming. Bands move camp weekly, and
  each member follows, stays or joins another camp. Huts and fields are things in the world.
  A hut sleeps 5, and beds are chosen by warmth, then ties. Every learned value is a habit
  and a norm, blended by which pays off. Smoke PASS, all 39 checks @ v0.8.0, 2026-11-04.
  The bands year kept 81/100 alive.
- The view is Claude Basic 0.6.0 at http://localhost:8000/research/EvoEco/sim/. It loads and
  runs (checked 2026-11-04); the charts looked sparse early on.
- `ODD.md` is v0.3 plus Default blocks for Stages 1–5d (not reviewed by Chris).

**Metrics** (bands, one seed each unless noted):
- Moving camp, two years: 98/100 alive, against 87 with fixed homes.
- Shared huts: 4.8–5 sleepers each; midwinter warmth 0.57–0.75. Nothing given: 83/100 alive
  over three years.
- Rate fixes, one year, seeds 1–3: 81 / 99 / 100 alive.
- Camp weighing is 45% of run time.

**Branches:** `main` only, local; no remote.

**Open:**
- Seed 1's first-winter hunger under the slower told rate is undiagnosed; Chris accepted the
  fix as is.
- Run-to-run variation now limits reading results; there is no multi-seed measure yet.
- ODD Opens:
  - does a norm include its own observations (§4.4)?
  - do fields take land from wild plants (§2, folded into Stage 6)?
- Flagged Defaults: the lethal-night cost; the food-gap fade. The Stage 1–5d Defaults await
  Chris's review. Citations unchecked.

**Next action:** the Stage 6 design, one question at a time (aging, births by household ROI,
childhood, care, households from ties). Then make camp weighing cheaper before generation runs.

**Blockers:** none.
