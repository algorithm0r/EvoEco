# EvoEco — DEVLOG

*Append only, newest on top. Never edit past entries.*

<!-- append new entries above this line -->

## 2026-11-01 — ODD v0.2: scheduling, planning, exchange, sensing, tree, initialization

**Done:** Second design session (EvoEco), one question at a time. Decided:
- synchronized daily phases; meeting = co-location; full phase order (§3)
- route planning as "noisy pathfinding" over a one-day horizon; end-of-day holdings valued by
  best of keep / trade / give (gift = trade for belonging); households plan together
  (sequential best response); ties anticipated from their habitual routes (§7.6)
- barter: bid rule (better of fair middle and going rate, deal at the midpoint of bids);
  prices are exchange ratios with geometric middles; ties give on need with no price (§7.1–7.2)
- matching: scarcest good's holders pick first (§4.7)
- learning by chat with the people met, capped at ~k = 5 a day (§4.6)
- hand-crafted recipe tree up to the iron age, narrow to start, random trees as robustness (§2)
- blank start at zero, scaffolding only during burn-in, rerun burn-in or fork from snapshot (§5)

**Changed:** `ODD.md` only (v0.1 → v0.2), including stale lines brought up to date (§4.4,
§4.8, §7.2). Corrections made along the way at Chris's prompting: the price-band analysis
(estimates need not agree, so a band of stable going rates exists); one-sided best-partner
matching rejected; mutual best rejected after a toy test.

**State:** design only, no code. Toy matching test (scratch script, not in repo): with
differing cost estimates, mutual best resolved 48% of pairings at 60 agents / 5 goods (noise
0.1), 18% at noise 0.25; 100% with equal estimates. Citations still unchecked. Many Defaults
were written and ledger-checked by Claude alone. Committed on top of f10d748.

**Next:** a cold ledger audit: a fresh agent checks every Decided/Default rule against §4.2
(~50k tokens; Chris to approve). Then the remaining Open items (output measures, the
trickle-down note) and the first concrete recipe tree.

## 2026-11-01 — Project born; ODD draft v0.1
**Done:** Design conversation with Chris (in the Personal Assistant session) from a first sketch of
supply-chain structure to 26 ODD questions answered. Purpose, entities, scales, learning,
reciprocity, barter/price, discovery, births and inheritance are decided; scheduling, daily
planning, partner search, initialization and the rest are open. All of it recorded in `ODD.md`.
**Changed:** created container `Research/EvoEco/`, this `sim/` repo (`ODD.md`, `DEVLOG.md`,
`.gitignore`), container `CLAUDE.md`, and the PA hub `projects/r-evoeco.md`.
**State:** design only; no code. Citations in ODD.md are from memory and unchecked.
**Next:** continue the ODD question by question, starting with process scheduling (the daily order).
