# EvoEco — DEVLOG

*Append only, newest on top. Never edit past entries.*

<!-- append new entries above this line -->

## 2026-11-09 — Stage 6 built but apprenticing; famines traced; roots doubled; 40-year runs

**Done:** Stage 6, all but apprenticing out, each piece recorded in the ODD first.
- *Camps weighing* is ~3× faster: dominated stops are dropped before scoring.
- *Trust* (§2 Ties): familiarity slows forgetting, grudge tolerance grows with trust, and a
  tie's need weighs in the giver's cost.
- *Spin-up* (§5): adults aged 15–45, both sexes, no kin. The colony saves and reloads
  (`colony.mjs`, v8 serialize).
- *Life cycle* (`life.js`): sexes, pregnancy, nursing, childhood stages, a child passed on
  when its carer dies, care from rest hours, old-age care as gifts. Monthly conception on
  both parents' return, with the prior from experience. Goods stay where the dead left them.
- *Planning together* (§7.6): morning announcements, ties' hauls counted by learned
  reliability.
- *Famine diagnosis* (counterfactuals from saved colonies, one run each). There were two
  triggers: a synchronized first birth cohort's care hours (seed 3), and camps stranded on
  stripped land (seeds 1, 2). Mothers feeding dying children and the return on a child were
  ruled out.
- *Staggered start* (§5, Decided 2026-11-07): each starting woman's first chance to conceive
  is spread over `life.startWait` = 3 years.
- *Leaving a camp that stays* (§5, Decided 2026-11-07): members weigh joining another camp
  in reach even when theirs does not move.
- *Roots 1000 → 2000 per land.* Alive at 4 years, seeds 1–3: 127 / 135 / 118, was
  66 / 75 / 45. ×1.5 was mixed and nuts ×2 did not help. At 20 years: 124 / 96 / 128, was
  18 / 25 / 41.

**Changed:** `src/life.js` (new), `colony.mjs` (new), `src/agent.js`, `planner.js`,
`exchange.js`, `world.js`, `params.js`, `util.js`, `datamanager.js`, `ui.js`, `index.html`,
`runner.mjs`, `smoketest.mjs`. ODD §2, §5 and §7.6 gained Stage 6 as-built and Decided
entries. Stage 6 boxes are ticked in DEVPLAN, and the new findings are Backlog lines.

**State:** smoke PASS @ v0.9.0-dirty (pre-commit).
- Bands year: 101/100 alive, 1,626 trades, 9,044 gifts, 599 trusted ties, 76 discoveries,
  10 conceptions, 156 camp moves, 165 joins. Solitary: 8/8.
- Planner: 0.413 ms per agent-day.
- 40 years, seeds 1–3 (scratchpad g40_*): 193 / 162 / 115 alive. The second generation
  matured (90 / 84 / 92) and is having children (8–10 births a year by year 40 in seeds 1–2).
- Famines at years 9–10 killed 22–27 children in each seed, plus smaller ones later.
- Women fall behind men in every seed: 37 / 34 / 21 women of 94 / 77 / 73 adults.
- Seed 3 sits flat at ~115 with 1–6 births a year. Seed 2 dipped to 96 at year 20.

**Next:** Chris's idea of a balanced starting demographic tree (ages, parent–child ties,
maybe pairs), against the §4.2 ledger. Then apprenticing out, and whether a woman's return
on a child should count the risk to her.

## 2026-11-06 — Stage 5g closed: plant kinds, shared land, processing; Stage 6 next

**Done:** Built 5g from the ODD §2 decisions of 2026-11-05.
- *Shared land.* A hex's land is shared by grass, roots and trees (plus fields while they
  stand). Each cover spreads into bare land in the growing season; trees take grass and root
  land slowly, only where moisture is above the forest line; open land drifts to its natural
  mix. Cleared wet land is grass after a summer and forest within 7 years; dry land stays open.
- *Food kinds.* Greens (spring), seeds, the wild grain (summer), nuts (autumn) are crops: the
  season's whole crop is ripe when its window opens, and a hex picked bare is empty until next
  year (Chris's Decided rule; a first in-season refill broke it and was removed). Roots
  (autumn, winter) and wood are the cover itself: taking shrinks it. Foods are eaten
  fastest-rotting first. Agents know the seasons; the winter-growth floor is gone.
- *Fields* take bare, then grass and root land, never under trees; the land goes bare when the
  field closes.
- *Processing* as know-how: drying greens, roasting nuts (wood), grinding seeds (flint).
- *Starting know-how* is a setting (`agents.knowhow`), default no tech level; hunting,
  gathering, fire, stone tools and the gourd are assumed (Chris, 2026-11-05).
- *Rebalance against bands.* Food per land raised; planning priors set to about the old
  prior's food in every season (optimistic priors stopped winter storing: ~30% died).
- *Speed.* The Keep projection loop rewritten on typed arrays with per-day inflow caches
  (cleared on chat and learning): 6 → 2.5 ms per agent-day, identical results.
**Changed:** `src/params.js` (`land`, resource kinds, foods, `knowhow`, `priorPerHour`),
`src/tree.js` (PROCESSES, foods by rot), `src/mapgen.js`, `src/world.js`, `src/agent.js`,
`src/planner.js`, `src/exchange.js`, `src/datamanager.js`, `src/observer.js`, `src/ui.js`,
`index.html` (cover and held charts, food layers), `smoketest.mjs` (section 4 rewritten, new
tests). ODD §2 gained the 5g as-built block; §5 the know-how and gourd decisions; superseded
as-built notes (Stage 1 placement, 5d wild grain) are marked. DEVPLAN: 5g closed, remaining
processing to 5f.
**State:** smoke PASS @ v0.8.0-dirty (pre-commit; tagged v0.9.0 on commit). Bands year:
92/100 alive (8 hunger), 41 discoveries incl. drying, roasting, grinding, lean-to; 2,440
trades, 2,427 gifts, 381 trusted ties; winter 7.4 h/day vs summer 4.6; planner 0.63 ms per
agent-day (smoke). Three years, seed 1: 82/100 alive (deaths 8, 1, 9, all late winter);
processing batches yr 2 drying 128 / grinding 155 / roasting 52, yr 3 1,052 / 949 / 78; 30
farm discoveries; 2.53 ms per agent-day. Roots cover 0.21 → 0.165, trees 0.354 → 0.302 over
three years (firewood). Browser page loads clean. Ledger: covers and succession are
landscape; season knowledge is a §5 assumption; eating order and processing are individual
rules; nothing imposes ties, prices, specialization or inequality.
**Next:** Stage 6 build: trust, spin-up, sexes and childhood, conception, planning together,
cheaper camp weighing, the fix 2 check.

## 2026-11-04 — Stage 5d closed: moving camp, shared huts, habit and norm; Stage 6 next

**Done:** Five pieces, each decided by Chris and recorded in the ODD before coding:
- *Moving camp (ODD §5).* Every 7 days a band shortlists 5 sites, ranked by how full of plants
  and wood the members last saw the land within 2 hexes. Each member scores each site by its
  own best day there (planBest without trade). The band moves if arrival plus six days at the
  site cost less than seven days staying. Each member then follows, stays or joins another
  camp, with belonging weighed. The walk is charged against the day (`walked`). Fix along the
  way: the projection had charged the walk to every future day (`capAhead`).
- *Huts and fields are things in the world (§5).* Anyone may use a hut. Dwellings live in
  `world.dwellings`, and empty ones wear on their own. A planter knows its own field ripens,
  chat passes on ripe grain, and fields beyond half a day's reach drop out of the harvest
  projection.
- *Shared huts (§5).* A hut holds 5 and a lean-to 2. Each evening agents choose beds by warmth,
  then ties (`bedDown`); no one is turned out of a full hut.
- *Fix 2: habit, norm and arbitration (§4.4).* Every learned value (yields, seasonal flows,
  evening food, working day, sowing return) keeps a habit, a norm and the squared misses of
  each against own experience. They are blended by inverse error, and the blend snaps at
  0.9. Chat tells habits the speaker has lived. Rate fixes: the told norm moves at 0.05 (was
  0.2), and the working day learns at 0.05 (was 0.3).
- *View.* A sub-session vendored Claude Basic 0.6.0. Controls sit under the map, with line
  charts and histograms; `src/charts.js` is removed.

Then Chris brought Stage 6 forward (population turnover, culture across generations, growth
into competition between bands). 5d closed half-built; clearing, bread and wells went to a
new 5f.
**Changed:** `src/agent.js`, `src/world.js`, `src/planner.js`, `src/exchange.js`,
`src/params.js` (`camp`, hut and lean-to sleepers, `arbRate`, `arbExtreme`), `src/observer.js`,
`src/ui.js`, `src/datamanager.js`, `src/main.js`, `index.html`, `vendor/claude-basic/`, and
`smoketest.mjs`. ODD §5 gained four Decided blocks with as-built notes and results. ODD §4.4
gained fix 2, its rates, and one Open (whether a norm includes its own observations). §2 now
has an Open on fields taking land from wild plants. DEVPLAN: 5d closed, 5f added, Stage 6
active (camp perf, land, the fix 2 check moved in from the Backlog). CLAUDE.md and README:
the run URL on the 8000 server, versions. The stale port-8765 `launch.json` above the repo
is removed.
**State:** Smoke PASS, all 39 checks @ v0.8.0 (run on 2026-11-04 before the header-comment
edits). The bands year with exchange kept 81/100 alive, against 100 at v0.7.0-1; this is the
seed-1 hunger under the slower told rate. Over the year: 1,879 trades, 2,779 gifts and 234
trusted ties; 24 discoveries by tinkering, 10 of them farming. The planner costs 0.81 ms per
agent-day. Measurements (bands, one seed each unless noted):
- *Moving camp, two years, seed 1:* 98/100 alive, against 87 with fixed homes.
- *Huts in the world, three years:* 152 returns to old sites; finished huts were reused 96
  times.
- *Shared huts:* huts hold 4.8–5, and 80–95% of sleepers helped build. Midwinter warmth is
  0.57–0.75. Nothing given: 83/100 alive (a merged camp of 40 lost 15).
- *Fix 2:* 100/100 in both runs.
- *Rate fixes, one year, seeds 1–3:* 81 / 99 / 100 alive. Seed 1 lost 19 to hunger, against
  100 with the told rate at 0.2; the cause is undiagnosed, and Chris accepted the fix as is.
- *Speed:* camp weighing is 45% of run time.
- *View:* loads and runs at http://localhost:8000/research/EvoEco/sim/; the charts looked
  sparse at day 45.
**Next:** Stage 6, households and generations, design first: aging, births by household ROI,
dependent childhood, care from rest hours, households from ties. Camp weighing made cheaper
before generation runs.

## 2026-11-03 — Stage 5d (part 1): farming

**Done:** Grain, fields, sowing (hoe), reaping (sickle) by anyone, and wild grain from plains
foraging in summer. Farming is discovered by tinkering with grain on fertile land. Fields
ripen on day 150 and close on day 240, when each planter learns its return per seed: its own
reaping plus grain gifted to it by those who reaped its field (Chris's rule). Grain is eaten
(cooked in a pot) and given as food in gifts. The first run sowed nothing: from autumn the
120-day projection could not see next spring or the harvest after, so all wild grain was
eaten. The projection now reaches a year (weekly to 120 days, then monthly), and grain held
at spring sowing is assumed sown. Testing discount 0.997 against 0.99 made little difference,
so the discount is unchanged. Candidates are ranked without the trade arm (2.9 → 1.6 ms per
agent-day).
**Changed:** `src/tree.js` (hoe, sickle, farm, grain), `src/agent.js` (sow, reap, wild grain,
eating grain, fields, farmReturn, learnFarm, pendingGrain, farmFert, seenGrain), `src/world.js`
(fields, fieldsDay, canFarm, canSow, fertility, sow, reap, creditReturn), `src/planner.js`
(sow and reap candidates and costs, year-long projection with harvest and sowing, ranking
without trade), `src/exchange.js` (grain hour cost, food shortfall counting grain, grain gifts
credited), `src/params.js` (goods.grain, horizonFar, keepLongStep, sowCandidates),
observer, ui, datamanager, main, `smoketest.mjs` (section 11). ODD §7.6 5d block; DEVPLAN 5d
active, farming items done, bread, wells and clearing left.
**State:** smoke PASS, all 39 checks. In the controlled field, 8 seeds at fertility 0.50 gave
40 grain on day 150; the friend and the planter each reaped 16; 10 were given back, and the
planter learned 7.55 per seed (6.80 from its own reaping alone). Bands year: 17 farming
discoveries, first on day 100. Headless seed 1, three years, nothing given: first sowing in
year 3, 31 seeds → 274 grain, 54 sown the next spring; 83/100 alive. With farming known: 115
seeds → 1,032 grain in year 3, food 0.98–0.99 through that winter. Planner ~1.6 ms per
agent-day in bands runs (0.92 smoke measure).
**Next:** 5d part 2: bread (quern, clay oven), wells, clearing forest. Or 5c metals.

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
