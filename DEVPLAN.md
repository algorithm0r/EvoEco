# EvoEco — DEVPLAN
*Living document, not frozen. Update as the design evolves.*

The spec is `ODD.md`; each stage builds the ODD sections it names. Two rules hold for every
stage (see `CLAUDE.md`):
- **Ledger check at close.** Every rule the stage added is checked against ODD §4.2. A rule
  that writes in something the results are about does not ship.
- **Gaps are questions.** Where the ODD is silent, ask Chris, record the answer in the ODD, then
  code it. Numbers are `PARAMETERS`, balanced as we go and logged when changed.

Order of build: the world, then one agent living in it, then the tree, then agents seeing each
other, then exchange, then households and generations, then the foundation as a whole. Each
stage is testable on its own before the next adds interaction.

## Built
- ODD v0.2+ (design, 2026-11-01/02).
- Scaffolded from engine v2 (vanilla-JS canvas + standard DB client), 2026-11-02.
- Stage 1 world: seeded hex map (terrain, rivers, springs, deposits), one resource mechanism,
  seasons, terrain-weighted travel times, map drawn with resource layers (2026-11-02).

## Not yet built
- The EvoEco model itself.

## Stages

### Stage 1 — The world: hex map, resources, seasons  [ DONE ] (closed 2026-11-02)
ODD §2 (Landscape and resources, Scales), §3 (random orders).
- [x] Hex grid (odd-r offset, cube distances); one hex ≈ an hour's walk; terrain weights travel
- [x] Map generator from parameters + seed: clustering per resource, distance between key
      pairs (copper–tin); option to load a fixed saved map
- [x] One resource mechanism (stock, regrowth, inflow) covering renewables, non-renewables
      and water; the v0 resources (wild plants, forest, fertile land, water, flint, clay,
      copper, tin, iron)
- [x] Day tick with a year of days; seasonal regrowth and water flow
- [x] Hex path travel time (terrain-weighted shortest path)
- [x] Observer draws the hex map and resource layers; replace the demo drifters
- [x] Smoketest: same seed → same map; stocks stay within bounds; renewables regrow after
      depletion, non-renewables don't
**Done when:** a seeded map is generated and drawn in-browser, resources deplete and regrow
by class and season, and `smoketest.mjs` asserts determinism and resource bounds (the demo
drift check is gone). ✓ Met: smoke PASS on all 13 checks (determinism, map round trip,
seasonal regrowth, deposits, bounds over 900 days, travel); map seen in the browser.
Ledger check: Stage 1 adds landscape rules only; resource placement may make location matter,
which ODD §2 intends (inequality from the world), and nothing about exchange, ties or prices.

### Stage 2 — One agent alive: needs, hours, route planning  [ DONE ] (closed 2026-11-02)
ODD §2 (Needs, Scales), §4.3, §4.4 (habits), §7.6 (route planning).
- [x] Needs with set points and convex cost: food, water, warmth (shelter level + daily
      fire), rest; belonging present but inert until Stage 4
- [x] Hour budget per day; work burns food
- [x] Starting know-how (ODD §5): fire, level 1 of each ladder (cooked wild food, gourd,
      lean-to). Stone tools wait for Stage 3 (tools are its subject)
- [x] Route planner: stops at useful hexes only, one-day horizon; end-of-day holdings valued
      by Keep (future need, discounted by storage). Habit as a cached plan not needed yet
      (0.26 ms per agent-day)
- [x] Consume, store, perishables decay
- [x] Habit learning: one error-driven update per activity (yield from a full hex), with
      sightings of each hex's fullness remembered (ODD §7.6 Stage 2 block)
- [x] Scouting by the curiosity term (moved up from Stage 3: perception needed it)
- [x] Aging and death (no births yet)
- [x] Measure planner cost per agent-day (ODD §7.6 estimated ~10¹⁰ evaluations per
      generation if exhaustive): 0.26 ms → ~700 s per generation at 300 agents
- ~~Settle the fixed-home question~~ → shelved: hemmed-in loners starving may be what
      reciprocity should rescue; revisit only if it persists once agents can share
**Done when:** ~~solitary agents keep needs near set points on a rich map~~ (changed
2026-11-02, Chris: humans are not solitary; balancing for lone survival does not lead to the
goal state) the mechanics work: needs held near set points by those living on a rich map,
failure on a barren one, route choice responding to season and depletion, planner cost per
agent-day measured and projected. ✓ Met: smoke PASS (rich-map mean food 0.974, water 1.000;
winter 8.2 h vs summer 5.9 h; barren all starve by day 29; stripped hex dropped 9× → 0×;
0.26 ms per agent-day, ~700 s per generation at 300 agents). Solitary survival reported,
not required (7/8 on the rich map). Ledger check: needs, perception, planning and storage
are individual mechanics; nothing about exchange, ties, prices or inequality is written in.
The numbers raised to get loners through winter are provisional (Backlog).

### Stage 3 — The recipe tree and tools  [ PLANNED ]
ODD §2 (Goods and quality, First tree v0, Tools), §4.5, §7.3, §7.6 (partial projects).
- [ ] Tree v0 as data (one file): recipes, inputs, qualities, hours, tool requirements
- [ ] Task-specific tools (axe, hoe/sickle, pick) as production multipliers; wear and repair
- [ ] Intermediates: wood, charcoal, fired clay, metals
- [ ] Partial projects carry partial value across days; future discount as a swept parameter
- [ ] Tinkering as an activity, scored by the curiosity term (~~scouting~~ → **Stage 2**)
- [ ] Know-how lives in agents; lost when no one practices for a generation
- [ ] Quality valued intrinsically and instrumentally (food restores more, tools last longer)
**Done when:** without exchange, agents holding the right inputs discover level 2+ by
tinkering, multi-day builds get started and finished, and a test case shows know-how lost when
a craft lapses.

### Stage 4 — Meeting, chat and norms  [ PLANNED ]
ODD §3 (meeting = same hex, same day), §4.4 (norms, arbitration), §4.6 (chat cap k).
- [ ] Co-location per hex per day
- [ ] Chat with up to k people met (ties first once ties exist; random otherwise)
- [ ] Norm tables (cost norms) from own and reported experience; precision-weighted
      habit/norm arbitration
- [ ] Learning know-how by seeing it practiced
**Done when:** cost norms converge toward true costs where agents meet often and stay off
where they don't; survivorship bias in norms is measurable.

### Stage 5 — Exchange and ties  [ PLANNED ]
ODD §2 (Ties, Owing), §3 (exchange phase), §4.7 (matching), §7.1, §7.2.
- [ ] Barter: own cost vs estimated other cost, fair bid (geometric middle), going rate, deal
      at the midpoint of bids, walk-away guard; price norms per pair of goods
- [ ] Matching in rounds per good, scarcest good first, random order within
- [ ] Kind-offer tally; trust spectrum (regular trade → barter credit → trusted tie); trade
      weight as a swept parameter including 0
- [ ] Owing balance in occasions; per-agent daily chance of forgetting
- [ ] Gifts to ties in need, strongest first, before barter
- [ ] Holdings valued by best of keep / trade / give; trade enters the plan
- [ ] Log each agent's cost-estimate error (premium decomposition, ODD §7.2)
**Done when:** in a controlled test, prices move in the right direction with supply and demand;
ties form through barter from a no-tie start; grudges (unreturned balances) appear and fade.

### Stage 6 — Households and generations  [ PLANNED ]
ODD §2 (Households, Agents life cycle), §7.4, §7.5, §7.6 (household planning).
- [ ] Households form from strong mutual ties and dissolve with them; shared shelter
- [ ] Household planning by sequential best response; ties anticipated from habit
- [ ] Care from rest hours; dependent childhood; old-age decline and care
- [ ] Births by household ROI; population endogenous
- [ ] Death: holdings stay where they lie (open access)
**Done when:** households form and dissolve on their own, and a population persists across
several generations without scaffolding.

### Stage 7 — The foundation: burn-in, measures, runner  [ PLANNED ]
ODD §1 (patterns), §4.10, §5.
- [ ] Starting layout: 5–8 bands of 20–40 agents, a day or two apart
- [ ] Scaffolding, each item listed in the ODD, used only during burn-in and removed
- [ ] Measures: percentiles (10/50/90/99) of quality consumed per category; rest and
      belonging distributions
- [ ] Snapshot and fork (matched runs from a settled world)
- [ ] Headless runner writes self-describing packets; reliability check across independent
      burn-ins
**Done when:** several independent burn-ins from zero reach a foundation that reproduces the
ODD §1 patterns (needs met mostly through the economy; prices move with supply and demand),
and snapshots fork matched runs.

### Stage 8 — Robustness  [ PLANNED ]
- [ ] Random recipe trees from parameters beside tree v0
- [ ] Heterogeneity settings (forgiveness, talent as a final-run robustness test only)
- [ ] Sweeps of the swept parameters (trade weight, discount, forgiveness)
**Done when:** the foundation's §1 patterns hold across random trees and the swept ranges, or
the ranges where they fail are mapped.

### Stage 9 — Currency, the first ladder technology  [ PLANNED ]
ODD §1 (technology sequence).
- [ ] Currency as stored general purchasing power; variant with demurrage
- [ ] Matched runs against the foundation
**Done when:** currency runs fork from foundation snapshots and the measures are recorded.
How runs are compared is a research question to settle then (ODD §4.10).

## Backlog
*Planned work too small for a stage. One line each, led by its type (`fix:` / `feat:` /
`idea:`). When a stage takes an item up, strike it: `~~item~~ → **Stage N**`.*
- [ ] docs: check the ODD's citations (written from memory, unchecked)
- [ ] idea: further output measures (ODD §4.10); a research question for later
- [ ] idea: the trickle-down note (ODD open questions 2), revisit when capital is built
- [ ] idea: water is sparse (rivers, lakes, springs only; ~6% of hexes); check against
      band placement in Stage 7, maybe more springs or seasonal ponds
- [ ] fix: re-balance the numbers raised for solitary survival in Stage 2 (plants r 0.1, cap
      40, 6 units/h; rot 1%/day; Keep 20 days at 0.97) once agents can share, against the
      foundation forming, not against a loner surviving (Chris, 2026-11-02)
- [ ] idea: log slack and tinkering hours; scarcity that removes slack should slow discovery
      (ODD §7.3), and it bears on the results
