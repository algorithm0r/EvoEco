# EvoEco sim — STATUS

**Updated:** 2026-11-02 (Stage 2 closed)
**Verified:** never (the 2026-11-01 cold ledger audit checked ODD v0.2, not the code or v0.3)

**Stage:** Stages 1–2 `[ DONE ]`. Next stage not yet chosen (tree first, or meeting and
exchange first: asked of Chris).

**State:**
- Stage 1 world and Stage 2 agents (needs, route planning, perception, winter stores, learning,
  aging, death). Smoke PASS, all checks @ Stage 2 close commit, 2026-11-02. Seen in the
  browser; no console errors.
- Solitary survival is reported, not required (Chris: humans are not solitary). On a rich map
  7/8 loners live a year; on the default map 3–5 of 8.
- `ODD.md` v0.3 plus Stage 1 and Stage 2 Default blocks (not reviewed by Chris).

**Metrics:** rich map, among the living: mean food 0.974, water 1.000; hours winter 8.2 vs
summer 5.9; barren map all starve by day 29; planner 0.27 ms per agent-day (~730 s per
generation at 300 agents).

**Branches:** `main` only, local; no remote.

**Open:**
- Numbers raised for loners (plant yields and regrowth, slow rot, Keep 20 days) are
  provisional; re-balance against the foundation forming (Backlog).
- Stage 1–2 Defaults await Chris's review. Citation check (Backlog).

**Next action:** Chris's call on the stage order; then start that stage.

**Blockers:** none.
