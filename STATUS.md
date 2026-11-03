# EvoEco sim — STATUS

**Updated:** 2026-11-02 (Stage 2 in progress)
**Verified:** never (the 2026-11-01 cold ledger audit checked ODD v0.2, not the code or v0.3)

**Stage:** Stage 2 — one agent alive `[ ACTIVE ]`; blocked on one design question.

**State:**
- Stage 1 world done (smoke checks pass).
- Stage 2 agents live, plan routes, store food for winter, learn, age and die. Smoke 19 PASS,
  1 FAIL @ Stage 2 WIP commit, 2026-11-02: on a rich map 7 of 8 survive a year; the one who
  dies has a hemmed-in forest home. Seen in the browser; no console errors.
- `ODD.md` v0.3 plus Stage 1 and Stage 2 Default blocks (not reviewed by Chris).

**Metrics:** rich map mean food 0.974, water 1.000; hours winter 8.2 vs summer 5.9; barren map
all starve by day 29; planner 0.26 ms per agent-day (~700 s per generation at 300 agents).

**Branches:** `main` only, local; no remote.

**Open:**
- Fixed homes: agents can't move camp, so hemmed-in homes starve in late winter (asked of Chris).
- Stage 2 Defaults await Chris's review (need levels, death, Keep, perception, planner).
- Numbers are first guesses. Citation check (Backlog).

**Next action:** Chris's answer on moving camp; implement it; the rich-map check should then
pass and Stage 2 can close.

**Blockers:** the design question above.
