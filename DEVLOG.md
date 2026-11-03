# EvoEco — DEVLOG

*Append only, newest on top. Never edit past entries.*

<!-- append new entries above this line -->

## 2026-11-02 — Stage 1: the world (hex map, resources, seasons, travel)

**Done:** Built DEVPLAN Stage 1 on Opus (Chris: Opus for the build, Fable optional for the
hard stages and ledger reviews). Seeded PRNG (no Math.random in the model); `hex.js` (odd-r
hex grid, cube distance, neighbours); `mapgen.js` (elevation/moisture noise → terrain by
quantile; rivers from springs; resource caps by terrain, floodplain, banks and clustered
deposits; tin placed by distance to the nearest copper); `world.js` (one resource mechanism:
logistic regrowth with a seed floor, daily water flow with the rains, deposits fixed;
seasons with growth/rain/cold factors; `take()`; Dijkstra travel hours; `exportMap()` and
`new World({ map })` for fixed maps); observer with terrain and resource layers; demo
drifters removed.
**Changed:** `src/util.js`, `src/params.js`, `src/world.js`, `src/observer.js`,
`src/datamanager.js`, `src/main.js`, `src/ui.js`, `src/charts.js`, `index.html`,
`smoketest.mjs`, `runner.mjs`; new `src/hex.js`, `src/mapgen.js`; `src/agent.js` removed
(Stage 2 brings agents). ODD §2 gains a Default block recording the Stage 1 map choices.
**State:** smoke PASS, 13 checks (seed 1): same seed → same map (d515a9c1 before the spring
fix), different seed differs; terrain plains 46.9%, forest 25.5%, hills 21.6%, river 2.0%,
lake 4.0%; 6 springs; tin–copper 25 hexes (target 25; seeds 2–5 also 25); stripped plants
0 after winter, 0.947 of cap after one growing season, 1.000 after two; deposits never
regrow; all stocks in bounds over 900 days; water spring 1.32 vs autumn 0.68; travel symmetric,
≥ hex steps, lakes blocked; 40 hexes within 4 h of a central plains hex; 0.08 ms/day. The tin
check failed first on a real bug (tin 25 hexes from one copper cluster, 5 from the other)
and passed after the fix. Map seen in the browser pane, no console errors. Runner updated but
not run (needs the DB).
**Next:** Stage 2: one agent alive (needs, hours, route planning, habits, aging and death).

## 2026-11-02 — ODD v0.3 (audit responses, tree v0, map); scaffold and build plan

**Done:** Chris answered the cold ledger audit; all 12 items now resolved or deferred.
Decided: ties form through barter on a trust spectrum (kind-offer tally); quality is valued;
matching in rounds per good; open access; currency = stored general purchasing power; run
comparison deferred as a later research question ("same total output" withdrawn); partial
projects carry partial value (with Keep, this is the long-term planning); inheritance: holdings
stay where they lie, everything else a ladder tradition; owing = balance of gift occasions,
fading at per-agent rates (grudges). Tree v0 decided (task-specific axe/hoe/pick, stone →
iron; food/water/shelter ladders 0–3); warmth = shelter level + daily fire; discovery only
through tinkering (an activity, as is scouting); start knows fire and stone tools; maps
generated (some experiments fix one), hex grid, a hex ≈ an hour's walk; starting layout 5–8
bands a day or two apart; a stranger is anyone without a tie, near or far. Then scaffolded
`sim/` from engine v2 (`/new-project`, into the existing repo) and wrote DEVPLAN Stages 1–9.
**Changed:** `ODD.md` v0.2 → v0.3 (committed separately). New: `CLAUDE.md`, `DEVPLAN.md`,
`README.md`, `index.html`, `runner.mjs`, `smoketest.mjs`, `src/` (engine v2, current `db.js`,
DB `evoeco`). Merged `.gitignore`/`.gitattributes`. Container `CLAUDE.md` working mode updated
(design → build).
**State:** no model code; the demo drifters model runs. `node smoketest.mjs` → PASS
(startMeanX 0.500 → endMeanX 0.749, drift 0.4). Several Defaults were written by Claude in
this session (forgetting both random and per-agent, level 1 known at start, hex = place, route
search over useful hexes) and are not cold-checked.
**Next:** DEVPLAN Stage 1: hex map, resources and seasons, replacing the demo model.

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
