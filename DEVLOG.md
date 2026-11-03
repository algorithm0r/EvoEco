# EvoEco — DEVLOG

*Append only, newest on top. Never edit past entries.*

<!-- append new entries above this line -->

## 2026-11-03 — Calibration: Keep projection, route search, speed

**Done:** Chris settled the harvest question: anyone may harvest, and what returns to the
planter through others counts in its feedback (ODD §2, mechanism Open). Then calibrated.
- *Huts:* traced the "huts don't help" result. They do (winter warmth 0.79 in a hut, 0.55
  under a lean-to); fires are rare (16% of winter evenings); deaths were hunger.
- *Food projection:* it assumed 10–12 food a day against 5.4–5.9 lived. It now projects lived
  seasonal inflows: food and wood gathered, plus net exchange.
- *Thirst:* that exposed a projection where tonight's hunger never faded, so agents traded
  water for food until 30 died of thirst. Fixed with a food gap that halves each projected
  week toward the usual seasonal level.
- *Search:* 80 of 99 thirsty mornings were search misses, because a far stop filled the day
  first. Search by gain per hour fixed that but broke the stripped-hex check: cheap poor work
  at home filled the day. The route is now built both ways and the better kept.
- *Lethal night:* added a cost of 1000 for a night that would kill. Thirst deaths went to 0.
- *Speed:* rewrote the projection loop on plain numbers, with season lookups once a day. Same
  results, 4.5× faster.
**Changed:** `src/agent.js` (flow and livedFood habits, got/xnet, seasonYield removed),
`src/world.js` (net exchange per agent), `src/planner.js` (Keep from lived flows, food-gap
fade, lethal night, inlined loop, projectionTable, shortlist by gain and rate, greedyRoute
twice, planHours), `src/params.js` (flowRate, keepPersist, fatalCost; projHours now only a
prior). ODD §2 harvest (Decided), §7.6 calibration block (Default; keepPersist and the
lethal-night cost flagged). DEVPLAN 5b-cal closed, 5d harvest note, three Backlog lines
ticked, four added.
**State:** smoke PASS, all 36 checks. Price 1.420 / 0.618 / 0.551; 1,025 trades (first day
49), 1,551 gifts, 119 trusted ties; largest unreturned 3.90; stripped hex used once after.
With the hut known: 169 huts started, 56 finished by day 240. Bands year: 12 pot discoveries,
8 learned by seeing. Headless seed 1, two years: 87/100 alive, 13 hunger deaths all in year 1,
0 thirst. Projected vs lived food within ~0.3 a day each season. Winter warmth 0.71 with hut
know-how (0.81 in a hut), 0.56 without. Planner 0.69 ms per agent-day in bands runs (was
2.58), 0.365 in the smoke measure.
**Next:** 5d farming (harvest settled), or 5c metals. Chris to review the two flagged
Defaults (lethal-night cost; half-per-week food fade).

## 2026-11-03 — Stage 5b: pots, huts, tinkering, know-how

**Done:** Clay digging; the pot (water level 2: stores water, saves trips); the hut (shelter
level 2: a 40-hour build over days, inputs used as the work goes, no warmth until finished,
the axe a multiplier on the work). Tinkering as an activity: discovery only with all inputs at
hand, scored by the curiosity term from the agent's own record. Know-how as a set per agent:
starts with stone and fire, grows by tinkering and by seeing a craft practised in the same hex
the same day (30%), kept for life. Partial projects valued by the ODD rule read literally. Two
earlier versions failed and are recorded in the ODD block. In the first, huts needed an axe, and
nobody held one in summer. In the second, the projection kept building next week, so
agents put the work off until autumn. Found and fixed an all-or-nothing fire in the Keep
projection's 7-day lumps: it made values jump by whole weeks of warmth. Making tonight's fire
partial too broke two Stage 4 checks (price and grudges), so tonight's fire stays
all-or-nothing. The Keep projection now counts rest, with the agent's learned working day by
season and its trips to water. Farming deferred to a new 5d: it needs Chris's call on who may
harvest a planted field under open access.
**Changed:** `src/tree.js` (pot, BUILDS, start know-how, DISCOVERABLE, goods clay and pot),
`src/agent.js` (dig and tinker activities, shelter as structures, buildWork, tinkerAt,
seePractice, busy habit, drink trip, pot wear), `src/planner.js` (candidates for builds,
recipes known and tinkering; tool wear in the plan; Keep with rest and assumed keep-recipes;
hutValue and projectValue), `src/world.js` (know-how records, seeing in the meeting),
`src/params.js`, `src/observer.js` (huts drawn), `src/datamanager.js`, `src/main.js`,
`src/ui.js`, `smoketest.mjs` (section 10). ODD §7.6 Stage 5b block; DEVPLAN 5b closed, 5d
added, charcoal and houses moved to 5c, five Backlog lines. Preview config at the container
level (`EvoEco/.claude/launch.json`, not in the repo).
**State:** smoke PASS, all checks. Stage 4 numbers unchanged (price 1.420 / 0.618 / 0.551;
984 trades, 1,787 gifts, 106 trusted ties, largest unreturned 3.81). Bands year: 8 pot
discoveries by tinkering (first day 10), 7,414 h tinkering, 2 learned by seeing. Tinkering
finds the pot at a clay bank with wood, nothing in 100 h on bare ground. Pot carries 2.50
against the gourd's 0.50. A hut finished in 5 days of 4 h with an axe, warming only then. With
the hut known, 200 started and 41 finished by day 240. Know-how kept by the watcher, lost when
never practised. Headless seed 1, two years, nothing given: 12 pot discoveries by tinkering and 5 learned by seeing (one chain 32 → 28 → 21 → 20); 19 pots made, 16 agents know the pot at the end; the hut was never found (it needs an axe in hand at a clay bank, with wood); 57 axes made and 128 trades of food for axes (5a: 14 and 6; the smoothed projection fire makes every unit of wood count); 11,032 hours tinkering; 87/100 alive (5a: 89). Planner 0.896 ms
per agent-day in the smoke measure, ~2 ms in bands runs.
**Next:** Chris's answer on harvesting under open access, then 5d (farming, bread, wells), or
5c (metals) meanwhile.

## 2026-11-02 — Stage 5a: recipe engine, stone tools, many-goods exchange

**Done:** Stage 5 split into 5a (stone tools), 5b (crafted levels, tinkering, know-how), 5c
(metals). Built `tree.js` (tools, recipes, goods), quarrying and crafting as planner activities,
tools as remaining life with wear and a yield multiplier, Keep valuing axes (and flint through
them), and exchange rewritten for any goods with per-pair going rates. First runs made no tools:
hill-only flint lay 5.5–11 h from every band, so flint was added to 10% of riverbank hexes
(river gravels). Fixed a planner bug the tools run exposed: extending a craft stop dropped its
recipe (craft stops are now fixed length).
**Changed:** new `src/tree.js`; `src/agent.js` (activities, holdings, tool use and wear,
crafting, pair price norms), `src/planner.js` (candidates, estimates, costs, Keep with axe),
`src/exchange.js` (rewritten for many goods), `src/params.js` (flint yield, river flint),
`index.html`, `smoketest.mjs` (pair-price market; tool checks), `runner.mjs`; ODD §7.6 Stage 5a
block; DEVPLAN 5a closed, 5b active, Backlog perf item.
**State:** smoke PASS, all checks: axe ×2.00 wood (8.00 → 16.00 in 2 h), worn out after 80 h;
bands year: 3 tools made, 36 trades in flint or tools; price test 1.420 / 0.618 / 0.551; a year
from no ties 815 trades, 1,250 gifts, 86 trusted ties. Headless seed 1, two years: 14 tools,
82 flint trades, 6 axes sold, 89/100 alive. Planner cost up to 0.8–1.3 ms per agent-day
(Backlog).
**Next:** 5b: pots, huts, farming, charcoal and fired clay, multi-day builds, tinkering,
know-how.

## 2026-11-02 — Stage 4: exchange and ties

**Done:** `exchange.js`: gifts to ties in need (strongest first; given when the giver's own
cost falls, belonging included; grudge limit on unreturned gifts), barter in rounds per good,
scarcest first, holders picking by their own gain, bid rule with geometric middles and going
rate, walk-away guard by hours and need, lot-by-lot quantity, kindness tallies, owing balance
with per-agent forgetting, belonging from two-way ties, price norms from trades made, seen and
told, chat ties-first, Trade arm in the planner (`holdingsCost`/`keepCost` refactor). Limits
were hours-only at first, which cannot move price with supply and demand; now hours adjusted by
need (marginal values in the agent's own cost), as §7.2 says. A first controlled test varied
holdings and moved price the wrong way (food and wood are complements: a fire stretches food);
the test now varies sellers against buyers, where scarcity decides who picks.
**Changed:** new `src/exchange.js`; `src/agent.js` (ties, belonging, price norm, chat order),
`src/planner.js`, `src/world.js`, `src/params.js` (exchange block; band sliders),
`src/datamanager.js`, `index.html`, `smoketest.mjs`, `runner.mjs`; ODD §7.6 Stage 4 block;
DEVPLAN Stage 4 closed, Backlog +2.
**State:** smoke PASS, all checks: wood 1.208 / 0.771 / 0.637 food at 2:8 / 5:5 / 8:2; bands,
a year from no ties: 755 trades (from day 3), 1,203 gifts (from day 5), 83 trusted ties,
largest unreturned balance 3.36, a balance of 3 fades to 1.10 in 100 days; 76/100 alive,
belonging 0.87. Headless seed 1, 2 years: barter peaks in autumn–winter (30–50 per 45 days),
then gifts replace it within bands (140–190 per 45 days, no barter in year 2); estimate error
0.32 → 0.15. Planner 0.23 ms per agent-day. Browser: runs (rAF pauses while the pane is
hidden), no console errors.
**Next:** Stage 5, the recipe tree, now with exchange in place; or Chris's review of the
Stage 1–4 Defaults first.

## 2026-11-02 — Stage 3: bands, meeting, chat, norms; land balanced for bands

**Done:** Chris: "exchange is central, lets do it next." DEVPLAN reordered: meeting (3),
exchange and ties (4), then the tree (5). Built bands (§5 layout brought forward), meeting by
co-location (home included), passive observation of others' work, chat with up to k = 5,
norms by error-driven update, precision-weighted habit/norm rate. Bands of 20 starved within
months at the old numbers, so the land was balanced for band density (plants ×10, ~half a
person per hex per year), with a 0.2 winter growth floor standing in for the winter food the
tree omits. Keep now looks 120 days in weekly steps and assumes gathering at learned seasonal
yields (assuming none made agents hoard ~800 units and work 13 h).
**Changed:** `src/world.js` (placeBands, meet, seasonIndex, winter floor), `src/agent.js`
(norms, observe, rate, chat, seasonal yields), `src/planner.js` (rate, Keep projection),
`src/params.js`, `smoketest.mjs` (Stage 3 checks; winter check now "slower than summer");
ODD §7.6 Stage 3 block; DEVPLAN reordered, Stage 3 closed.
**State:** smoke PASS, all checks. Bands: 5 × 20, closest centres 17 hexes apart; chat ≤ 5
(mean met 4.3 per agent-day); 100/100 hold a forage norm, 0.0% error (everyone has the same
true rate); 63/100 know hexes only from others. Headless, seeds 1–2, 3 years: 71 and 75 of
100 alive after year 1, no deaths after; 7–9 h worked. Planner 0.24 ms per agent-day.
**Next:** Stage 4: barter, matching rounds, price norms, ties, owing, gifts, belonging, trade
in the plan.

## 2026-11-02 — Stage 2 closed on mechanics; never balance for a loner

**Done:** Chris asked whether we were building self-sufficient foragers. Yes: the DEVPLAN put
one agent before exchange, with solitary survival as Stage 2's pass mark, and numbers were
raised to get loners through winter. Chris: that balances for something that does not lead
to the goal state; humans are not solitary. Stage 2's Done-when is now mechanics only and
the stage is closed. Moving camp is shelved (hemmed-in loners starving may be what
reciprocity should rescue).
**Changed:** `smoketest.mjs` reports solitary survival instead of requiring it; DEVPLAN Stage 2
closed with the changed Done-when, fixed-home item shelved, Backlog line to re-balance the
loner-tuned numbers; ODD §7.6 Stage 2 block records the balancing rule (Decided); `CLAUDE.md`
gains "never balance for a solitary agent".
**State:** smoke PASS (all checks): rich map, solitary 7/8 alive (reported); among the living
mean food 0.974, water 1.000; winter 8.2 h vs summer 5.9 h; barren all starve by day 29;
stripped hex 9× → 0×; planner 0.27 ms per agent-day.
**Next:** decide the stage order with Chris: Stage 3 (tree, tested without exchange) or
meeting and exchange (Stages 4–5) first.

## 2026-11-02 — Stage 2 (in progress): agents with needs, route planning, perception

**Done:** `agent.js` (needs, holdings, lean-to, evening consumption, perception and habits,
aging and death), `planner.js` (candidate stops, greedy route, Keep projection, curiosity),
world phases in ODD §3 order (plan → travel and work in random order → consume → learn →
aging), drinking from lake shores, agents and routes drawn, Stage 2 samples, Agents slider.
Getting agents to live took five fixes, each found by tracing a dying agent:
(1) homes beside lakes could not drink (lakes impassable) → drink from the shore;
(2) food clamped at 0, then at -1, hid the gain from a small meal from a starving agent →
levels unfloored inside the planner; (3) one shortlist for all candidates let thirst crowd
foraging out → best 4 per activity; (4) blind per-hex yield habits sent agents back to hexes
they had stripped → agents see fullness of nearby hexes and learn one rate per activity;
(5) food rotting 15%/day with a 5-day, 0.9 Keep could not carry anyone through winter → rot
1%/day, Keep 20 days at 0.97. Plants raised (r 0.1, plains cap 40, 6 units/h).
**Changed:** new `src/agent.js`, `src/planner.js`; `src/world.js`, `src/params.js`,
`src/observer.js`, `src/datamanager.js`, `src/main.js`, `src/ui.js`, `index.html`,
`runner.mjs`, `smoketest.mjs`. ODD §7.6 gains a Stage 2 Default block.
**State:** smoke 19 PASS, 1 FAIL. Stage 1 checks all pass. Stage 2: same seed → same
histories; rich map (plants ×3, 8 agents, a year) mean food 0.974, water 1.000 but **7/8
survive** (FAIL: the dead agent's forest home had 8 hexes within 3 h, the fewest); winter
8.2 h worked vs summer 5.9; barren map all 8 starve by day 29; a stripped favourite hex
(used 9× in 40 days) used 0× after. Planner 0.26 ms per agent-day → ~700 s per generation at
300 agents × 9,000 days. Default map, 8 agents, 3 seeds: 3–5 of 8 survive year 1 (forest
homes die in late winter), survivors then live through years 2–3. Seen in the browser, no
console errors.
**Next:** Chris's call on fixed homes (may agents move camp?), then close Stage 2.

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
