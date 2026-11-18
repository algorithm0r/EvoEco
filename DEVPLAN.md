# EvoEco — DEVPLAN
*Living document, not frozen. Update as the design evolves.*

The spec is `ODD.md`; each stage builds the ODD sections it names. Two rules hold for every
stage (see `CLAUDE.md`):
- **Ledger check at close.** Every rule the stage added is checked against ODD §4.2. A rule
  that writes in something the results are about does not ship.
- **Gaps are questions.** Where the ODD is silent, ask Chris, record the answer in the ODD, then
  code it. Numbers are `PARAMETERS`, balanced as we go and logged when changed.

Order of build: the world, then one agent living in it, then agents meeting each other, then
exchange and ties, then the tree, then households and generations, then the foundation as a
whole. (Reordered 2026-11-02: exchange before the tree, and no stage tests loners for
survival; humans are not solitary.)

## Built
- ODD v0.3 (design, 2026-11-01/02, amended as built).
- Scaffolded from engine v2 (vanilla-JS canvas + standard DB client), 2026-11-02.
- Stages 1–4, 5a, 5b, 5b-cal, 5d, 5g (tags v0.1.0–v0.9.0): the world, agents, bands, chat, norms,
  exchange and ties, stone tools, pots, huts, tinkering, know-how, farming, moving camp,
  shared huts, learned values with habit and norm, shared land, food kinds,
  processing.

## Not yet built
- Births, aging and households (Stage 6); metals (5c); containers (5e); clearing, bread,
  wells (5f); the foundation's burn-in and measures (Stage 7); the ladder (Stage 9 on).

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

### Stage 3 — Meeting, chat and norms  [ DONE ] (closed 2026-11-02)
*Reordered 2026-11-02 (Chris: "exchange is central, lets do it next"): meeting and exchange
before the tree, so nothing is balanced on loners.*
ODD §3 (meeting = same hex, same day), §4.4 (norms, arbitration), §4.6 (chat cap k).
- [x] Starting layout: bands a day or two apart (ODD §5, Decided), brought forward from
      Stage 7: exchange needs neighbours
- [x] Co-location per hex per day
- [x] Chat with up to k people met (random; ties first arrives with ties in Stage 4)
- [x] Norm tables (cost norms) from own and reported experience; precision-weighted
      habit/norm arbitration
- [x] Balance the land for bands, not loners (plants ×10, winter floor) and Keep on seasonal
      yields (ODD §7.6 Stage 3 block)
- ~~Learning know-how by seeing it practiced~~ → **Stage 5** (know-how comes with the tree)
**Done when:** cost norms converge toward true costs where agents meet often and stay off
where they don't; survivorship bias in norms is measurable. ✓ First half met: smoke PASS
(100/100 hold a forage norm, 0.0% error; no norm without a meeting; chat ≤ k; 63/100 know
hexes only from others). Second half moved to Backlog: with every agent gathering at the same
true rate there is no bias to measure yet. Ledger check: meeting is co-location, chat partners
random, norms pooled experience; no ties, prices or households written in.

### Stage 4 — Exchange and ties  [ DONE ] (closed 2026-11-02)
ODD §2 (Ties, Owing), §3 (exchange phase), §4.7 (matching), §7.1, §7.2.
- [x] Barter: own cost vs estimated other cost, fair bid (geometric middle), going rate, deal
      at the midpoint of bids, walk-away guard; price norms per pair of goods
- [x] Matching in rounds per good, scarcest good first, random order within
- [x] Kind-offer tally; trust spectrum (regular trade → barter credit → trusted tie); trade
      weight as a swept parameter including 0
- [x] Owing balance in occasions; per-agent daily chance of forgetting (expected value)
- [x] Gifts to ties in need, strongest first, before barter; belonging from ties
- [x] Holdings valued by best of keep / trade / give; trade enters the plan (Give decided
      at exchange, where the recipient's need is known)
- [x] Log each agent's cost-estimate error (premium decomposition, ODD §7.2): per trade
**Done when:** in a controlled test, prices move in the right direction with supply and demand;
ties form through barter from a no-tie start; grudges (unreturned balances) appear and fade.
✓ Met: smoke PASS (wood 1.208 / 0.771 / 0.637 food at 2:8 / 5:5 / 8:2 sellers to buyers; a
year from no ties: 755 trades from day 3, 1,203 gifts from day 5, 83 trusted ties; largest
unreturned balance 3.36, a balance of 3 fades to 1.10 in 100 days). Ledger check: prices come
from bids on own and estimated costs; ties from tallies of kindness judged by each agent;
gifts from each giver's own belonging; no tie, price, partner or group is written in.

### Stage 5 — The recipe tree and tools  [ ACTIVE ]
ODD §2 (Goods and quality, First tree v0, Tools), §4.5, §7.3, §7.6 (partial projects). Split
2026-11-02 into three parts, each with its own Done-when.

#### 5a — Recipe engine, stone tools, many-goods exchange  [ DONE ] (closed 2026-11-02)
- [x] Tree v0 as data (one file): recipes, inputs, hours, tool, task, multiplier, life
- [x] Task-specific stone tools (axe for wood, pick for quarrying) as production multipliers,
      worn by use and remade
- [x] Quarrying flint (a deposit, hills and riverbanks) and crafting at home as planner activities
- [x] Exchange over any goods: per-pair price norms (ODD §7.2: n(n−1)/2 going rates), own
      limits by need for every good, tools traded whole
**Done when:** agents make and use stone tools, tools raise their task's yield and wear out and
are remade, flint or tools change hands in trade, and the Stage 4 checks still pass. ✓ Met:
smoke PASS (axe ×2.00 wood, worn out after its 80 h; bands year: 3 tools made, 36 trades in
flint or tools; Stage 4 checks pass). Headless seed 1, two years: 14 made, worn axes remade,
82 flint trades, 6 axes sold. Tools stay rare at levels 0–1 (they only speed wood-cutting).
Ledger check: recipes and tools are the tree (data); who makes, holds and trades tools is
each agent's own plan and bargain.

#### 5b — Crafted levels, tinkering, know-how  [ DONE ] (closed 2026-11-03)
- [x] Level 2 recipes: clay dug from banks; fired-clay pots (water level 2); huts (shelter
      level 2). ~~houses~~ → **5c** (timber needs a metal axe); ~~farming (hoe/sickle),
      bread~~ → **5d**
- [x] Intermediates: fired clay (in the pot recipe). ~~charcoal~~ → **5c** (its only use is smelting)
- [x] Partial projects carry partial value across days (multi-day builds): the ODD rule read
      literally, value × share of the total hours in hand × learned chance of finishing
- [x] Tinkering as an activity, scored by the curiosity term; discovery only with the inputs
- [x] Know-how lives in agents; learned by seeing it practised; kept for life, so lost when
      no one who knows it has been watched practising (Learning know-how by seeing it
      practised, from Stage 3.)
- [x] Quality valued: the hut warms more, the pot saves trips. Food quality → **5d** (farming);
      longer-lasting tools → **5c** (metal tiers)
**Done when:** agents holding the right inputs discover level 2+ by tinkering, multi-day builds
get started and finished, and a test case shows know-how lost when a craft lapses. ✓ Met:
smoke PASS (bands year: 8 discoveries of the pot by tinkering; tinkering finds nothing without
its inputs; with the hut known, 200 huts started and 41 finished by day 240; know-how kept by
the one who watched, lost when never practised). Headless seed 1, two years, nothing given:
12 pot discoveries by tinkering and 5 learned by seeing (one chain 32 → 28 → 21 → 20); 19 pots made, 16 agents know the pot at the end; the hut was never found (it needs an axe in hand at a clay bank, with wood); 57 axes made and 128 trades of food for axes (5a: 14 and 6; the smoothed projection fire makes every unit of wood count); 11,032 hours tinkering; 87/100 alive (5a: 89). Ledger check: the tree is data; who tinkers, finds, learns and builds is
each agent's own plan and meetings.

#### 5b-cal — Calibration: Keep projection, route search, speed  [ DONE ] (closed 2026-11-03)
(Chris, 2026-11-03: calibrate before farming.)
- [x] Trace why huts didn't seem to warm: they do (0.79 vs 0.55); fires are rare; deaths were hunger
- [x] Keep projects from lived seasonal inflows (gathered + net exchange), with a food gap that fades
- [x] Agents know a night that would kill them (new rule, flagged for Chris)
- [x] Route search: shortlist by gain and gain per hour; build both ways, keep the better
- [x] Speed: projection on plain numbers, 2.58 → 0.69 ms per agent-day in bands runs
**Done when:** the projection matches lived days, deaths are explained, and the planner is fast
enough for generation runs. ✓ Met: projected vs lived food within ~0.3 a day each season; 87/100
alive over two years, all deaths hunger in year 1, none of thirst; ~0.7 ms per agent-day
(~30 min per generation at 300 agents).

#### 5c — Metals  [ PLANNED ]
- [ ] Copper, tin, bronze, iron: smelting with charcoal, metal tool tiers
- [ ] Charcoal (wood burned in a clay kiln) (From 5b.)
- [ ] House: timber cut with a metal axe, clay daub, hearth (shelter level 3) (From 5b.)
- [ ] Metal tools last longer (quality valued instrumentally) (From 5b.)
**Done when:** metal tools are made where the chain allows, and long-distance trade in tin or
bronze appears or its absence is explained by the map.

#### 5d — Farming, moving camp, shared shelter  [ DONE ] (closed 2026-11-04)
Harvest settled (Chris, 2026-11-03; ODD §2): anyone may harvest a planted field, and what
returns to the planter through others (a friend harvests and gifts a share) counts in the
planter's learned return on planting. Closed half-built (Chris, 2026-11-04: Stage 6 first).
- [x] Fields sown with a hoe in spring and reaped with a sickle after they ripen, by anyone; wild grain as
      the first seed; farming found by tinkering; the planter's learned return counts grain
      gifted back by those who reaped its field (Chris's rule). The projection reaches a
      year. (From 5b.)
- ~~Clearing forest for fields with an axe; tending~~ → **5f**
- [x] Grain cooked in a pot (food level 2): restores more, keeps (From 5b.)
- ~~Bread from a quern and a clay oven (food level 3)~~ → **5f**
- ~~Well near home, dug with a pick and lined (water level 3)~~ → **5f**
- [x] Bands move camp, weighed weekly; each member follows, stays or joins another camp (ODD §5)
- [x] Huts and fields are things in the world; a hut shelters 5, beds chosen by warmth then ties
- [x] Every learned value keeps a habit, a norm and a score of which pays off (ODD §4.4, fix 2)
- [x] Claude Basic 0.6.0 view: controls under the map, line charts and histograms
**Done when:** fields are cleared, sown and harvested across a year, grain and bread are made
and eaten, and the planter's learned return counts what comes back through others, with a
ledger check. Half met: sowing, harvest, cooked grain and the return through others are built
(smoke PASS); clearing and bread are not, moved to **5f**. Ledger check: fields, huts and camp
sites are things in the world under open access; who sows, reaps, builds, sleeps where and
follows whom is each agent's own plan and ties.

#### 5f — Clearing, bread and wells  [ PLANNED ]
(From 5d.)
- ~~Clearing forest for fields with an axe~~ → **5g** (clearing is cutting a hex's trees)
- [ ] Tending fields
- [ ] Bread from a quern and a clay oven (food level 3)
- [ ] Well near home, dug with a pick and lined (water level 3): a structure under open access
- [ ] Processing, the rest: smoking, parching, leaching; pickling later (needs salt) (From 5g.)
**Done when:** fields are cleared and sown, bread is made and eaten, and a well is dug and used,
with a ledger check.

*Original Stage 5 list and Done-when, kept for the record:*
> ODD §2 (Goods and quality, First tree v0, Tools), §4.5, §7.3, §7.6 (partial projects).
> - [ ] Tree v0 as data (one file): recipes, inputs, qualities, hours, tool requirements
> - [ ] Task-specific tools (axe, hoe/sickle, pick) as production multipliers; wear and repair
> - [ ] Intermediates: wood, charcoal, fired clay, metals
> - [ ] Partial projects carry partial value across days; future discount as a swept parameter
> - [ ] Tinkering as an activity, scored by the curiosity term (~~scouting~~ → **Stage 2**)
> - [ ] Know-how lives in agents; lost when no one practices for a generation
> - [ ] Quality valued intrinsically and instrumentally (food restores more, tools last longer)
> **Done when:** ~~without exchange,~~ (changed 2026-11-02: never test on loners) agents
> holding the right inputs discover level 2+ by tinkering, tools and goods are traded, multi-day builds get started and finished, and a test case shows know-how lost when
> a craft lapses.

#### 5g — Plant kinds, shared land and processing  [ DONE ] (closed 2026-11-06)
Decided 2026-11-05 (ODD §2 Landscape and resources). Before Stage 6 (Chris, 2026-11-05: "let's
do it now before stage 6"); Stage 6's build waits on it. Design gaps first, one at a time.
- [x] One plant-life capacity per hex, shared by wild food kinds, trees and fields; replaces
      the separate plants and wood caps (soil stays its own fertility stock, ODD Default)
- [x] A few wild food kinds differing by season, keeping, hours and terrain; winter roots and
      stored nuts replace the winter-growth floor
- [x] Trees as a slow competitor; succession (cleared → grass → forest)
- [x] Fields take land as they stand (From Stage 6.); sown on grass and root land, forest cut
      first (clearing, from 5f)
- [x] Processing as tree recipes: drying, roasting, grinding
- ~~Processing, the rest: smoking, parching, leaching; pickling later (needs salt)~~ → **5f**
- [x] Starting know-how as a setting, default no tech level (ODD §5, Decided 2026-11-05)
- [x] Rebalance forage yields, wood and farming against bands (never a loner)
**Done when:** fields and forest take land from wild food and give it back on abandonment,
food kinds are gathered in their seasons and some are processed to keep, and bands persist
through winter without the floor, with a ledger check.
✓ Met: fields and cleared forest give land back (smoke); four kinds in season; processing
practised from year 2; 92/100 through year 1, 82/100 after three, no floor; ledger clean.

#### 5e — Containers and carrying  [ PLANNED ]
Raised by Chris, 2026-11-03 (ODD §2, Open). Design first.
- ~~A carrying limit per trip (what one person carries home by hand)~~ → **5h**
- [ ] Containers: baskets for foraged goods; skins for water beside gourds and pots
- [ ] Porting as a service; transport: pack goats, oxen, horses, sledges, wagons
**Done when:** set once the design is settled.

#### 5h — Game, multi-day trips, then carrying  [ ACTIVE ]
ODD §2 Game, §5 multi-day trips (Decided 2026-11-11, mechanisms Open). Design first, one
question at a time. Raised by the winter check (2026-11-11): bands store ~130 days of food a
head by summer's end but move weekly in winter, since stores weigh nothing when carried.
- [x] Design walk (ODD §2 Game, §5 trips; 2026-11-11): small game a flow with a damped
      predator density; herds follow grazing, avoid predator and people traces; a herd
      predator; traces as pheromones; emergent parties; killer holds the carcass; spear in the
      kit, snares then bow by tinkering; injury for all, learned and priced; death costed as
      the life ahead; where to sleep chosen in the morning plan
- [x] 1. Game in the world, no hunting: small game and its predator, herds and theirs,
      the three traces; check the densities wobble and do not cycle (game.js; no people, 40
      years: small game 0.24–0.55, ~800 animals, ~15 wolves, no cycle; 2026-11-11)
- [x] 2. Hunting and meat: the hunt as a planner activity, success rising with party size,
      the spear, meat and dried meat, game sightings and the seasonal habit (bands year:
      ~225–275 big-game kills, parties of 1–7; a hollow of small game round camps)
- [x] 3. Injury and risk: hazard by setting, learned rates, priced hours; death costed in
      the planner and the Keep forecast
- [ ] Re-run the stores probe with death priced in the forecast: do late-winter hunger
      deaths fall? (From step 3.)
- [x] 4. Nights out: the morning plan chooses camp or a night out; evening exchange where a
      party sleeps (bands year: ~1,400 nights out, mostly spring and summer; no thirst deaths)
- [x] 5. The hunting ladder: snares and traps, then the bow (snares known by nearly all
      by the end of year 1; the bow found in year 2, none made yet)
- [ ] Balance: meat is 55–75% of food gathered, most of it small game hunted by hand (8 an hour
      made it 3/4 of the diet; now 4); hunting injuries rare (most injuries in camp)
- [x] Herds are hunted out: 10 years from scratch, seeds 1–3, herds ~1,050 → 10–110 animals by
      years 7–10. Chris (2026-11-12): herds should hold out; wolves are a control, not a
      competitor. Built: hunters find a herd by its size (n/(n+20)); wolves take in proportion
      and their numbers track the herds. After: herds 129–243 at year 10, none lost
- [x] fix: thirst deaths, three causes (2026-11-12): a hurt carer could not walk home part way;
      a stranded carer's water lay beyond half a day's reach; a camp move charged an absent
      hunter the walk. Also injury priced by who and where (dependents, stranding). After:
      none in 30 run-years
- [ ] Seed 3: children die of hunger in years 7–10 (3, 9, 3, 2 a year); predates the fixes
- [x] fix: NaN spread by chat: a stranded hunter's Infinity walk became a NaN working day, told
      as a norm until camps scored drinking as NaN (85 thirst deaths, seed 3 colony year);
      stranded hunters now plan nights out, learning skips non-finite values. Also a NaN return
      on farming already in the saved colonies (a field of no fertility) is reset on load.
      After: the seed 3 colony year has no deaths (the old code lost 21, 18 of hunger)
- [ ] Planner cost: 1.6–2.2× the last commit's (more stops weighed, nights out); holdings
      kept as one fast object (V8 dictionary mode past 19 keys had made it 3–5×)
- [x] Carrying design walk (2026-11-12, ODD §2 Containers and carrying): what can't be carried
      stays, open to anyone, and spoils; the limit is on all carrying; storage and carrying are
      technologies; no innate water container; one load with a cap per kind, gear raising it;
      food and water eaten in place; carried children and the load's weight in the day's effort;
      the first material tree (gourds, hides, fibre). (From 5e.)
- [x] C1. Carried vs stored, caps by kind, one load, children; the pack on a night out
- [x] C2. Weight carried times hours walked in the day's food
- [x] C3. Goods left at a moved camp, at a kill, by the dead out; picked up by whoever stops there
- [x] C4. The material tree: gourd fruit → dried → gourd; hide → tanning → water skin or bag;
      fibre → basket; gear's worth learned from what hands could not hold
- [ ] C5. The winter check: do stores now hold bands in place? (5 years, seeds 1–3, limit vs free)
- [x] Planner trips to fetch goods lying in the world: moving camp in more than one trip (Decided 2026-11-13); a fetch stop, and a site's forecast with trips back
- [x] Gear is a strategy whose efficiency is learned (ODD §2, Decided 2026-11-13): the return an
      hour bare-handed, with a basket and with a bag, learned as habit and norm; the projection
      scales gathering hours by it
**Done when:** set once the design is settled.

### Stage 6 — Households and generations  [ ACTIVE ]
ODD §2 (Households, Agents life cycle), §7.4, §7.5, §7.6 (household planning). Brought forward
ahead of 5c/5e/5f (Chris, 2026-11-04): population turnover, culture passed to the next
generation, and growth that brings bands into competition. Design first, one question at a time.
- [x] Camps weighing made cheaper before generation runs (45% of run time) (From Backlog.):
      dominated stops dropped before scoring, ~3× faster overall (2026-11-06)
- ~~Fields take land from wild plants while they stand (raised 2026-11-04; growth is what
      makes it bind) (From Backlog.)~~ → **5g**
- [x] Trust: familiarity slows forgetting; grudge tolerance grows with trust; a tie's need
      weighs in the giver's cost by its share of the giver's belonging (ODD §2 Ties, 2026-11-05)
- [x] Spin-up: adults 15–45, both sexes, no kin; save and reload the colony (ODD §5); the
      burn-in itself waits on births
- [ ] Check fix 2's point once ages overlap: the young know winter before living one (From Backlog.)
- [x] Track tie structure within camps from before births (density, clustering, largest group,
      share of strong ties inside camp; Chris, 2026-11-04). Baseline in ODD §4.10: no strong
      ties between camps; large camps are loose webs, small camps cliques; ties seasonal
- [x] Design walk (ODD §2, §5, §7.4, §7.6): sexes, emergent households, planning together,
      both parents consent, care as investment, childhood stages (2026-11-04); trust as one
      continuous record, old-age care as gifts, starting ages, fertility limits, the prior
      from experience, monthly conception (2026-11-05)
- ~~Households form from strong mutual ties and dissolve with them; shared shelter~~
      (2026-11-04: households are emergent, no entity) → measured, not built
- ~~Household planning by sequential best response; ties anticipated from habit~~ → planning
      together among strong ties (ODD §7.6)
- [x] Planning together: morning announcements; later planners count ties' hauls by a
      learned reliability; the evening exchange is the swap (ODD §7.6)
- [x] Sexes, pregnancy, nursing; childhood stages (nursing, learning, helping, mature); a
      child passed on when its carer dies; a child as its mother's extension (life.js)
- [ ] Apprenticing out: from 10 the mother hands the child each morning to a willing adult
      she trusts (ODD §2, Default 2026-11-04)
- [x] Care from rest hours; old-age decline, kept by gifts from ties (decline existed; care
      and the tie weight in gifts built)
- [x] Births: monthly conception, both parents' ROI with the prior from experience;
      population endogenous (the care weight decided 2026-11-06)
- [x] Death: holdings stay where they lie (open access): goods stay in the dead agent's
      dwelling and whoever sleeps there takes them (2026-11-06)
- [x] Crowding enters the forecast: each member learns the thinning per camper by season, and a
      site's seen land is cut by it times the headcount (ODD §5, Chris 2026-11-10)
- [x] A site's forecast prices rebuilding and its own land (ODD §5, Chris 2026-11-10): tech
      bands at 40 years, seeds 1–6, mean 345 alive vs 156 before
- [ ] Peer groups split together: a member chooses alone, so a group cannot leave a merged
      camp as one (ODD §5, Decided 2026-11-10, mechanism Open)
- [ ] Contests between bands without warfare: skirmishes settle who stays at a site (ODD §5,
      Decided 2026-11-10, mechanism Open; how it sits with open access is Open)
- [x] A woman counts the children she already has: another child's care hours come out of her
      rest, priced by her crowding (ODD §7.4, Decided 2026-11-13; exp001)
- [x] Children starve beside fed carers: traced (exp002, exp003) to the gift sum weighing her loss
      over months and the child's hunger over one evening. Fixed by two Decided rules: a child's
      need is its coming days on what it holds (2026-11-14), and the gift that pays most goes
      first (2026-11-15). exp004: child-days in deficit 91,475 → 1,062 (s1), 130,165 → 3,331 (s2)
- [x] Who dies under the new gift rules (exp005): young mothers of hunger, and families of
      thirst (a hurt mother unable to drink at camp once care took her hours, her children with
      her). Fixed by two Decided rules, 2026-11-16: children drink and eat on their own once old
      enough; a hurt carer puts her own recovery first (care never takes her drinking hours).
      Minor injury keeps 60% of the day. exp007: no child thirst deaths in either seed
- [x] Why mothers starve (exp008–011): they keep giving ~0.35 a day while their own level falls;
      no counterfactual (hunger kept, the child's real inflow, death priced with dependents)
      stops the gift paying. Behaviour of the valuation, not a bug (Chris: "this might not be a
      bug and if so it's a small one")
- [x] The start state (Chris's call, after child survival): children at the start, each with a
      woman of its band old enough to be its mother (ODD §5, Decided 2026-11-16). exp012: the
      age gap is filled; births are no steadier (2026-11-17)
- [x] Starting parents value their children like normal (`life.startGrownWeight` 0.6, Decided
      2026-11-17; exp013–015: first-60-day child hunger deaths 13/22/11 → 4/0/2)
- [x] Children eat in place with their mother (ODD §7.4, Decided 2026-11-17; exp016–018:
      hungry-beside-fed-mother days 1621 → 2)
**Done when:** households form and dissolve on their own, and a population persists across
several generations without scaffolding.

### Stage 7 — The foundation: burn-in, measures, runner  [ PLANNED ]
ODD §1 (patterns), §4.10, §5.
- ~~Starting layout: 5–8 bands of 20–40 agents, a day or two apart~~ → **Stage 3**
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
- [ ] idea: the 8 child hunger deaths left in exp018's colonies (5, 2, 1) are untraced; likely
      hungry mothers or no mother (Chris called the leak closed, 2026-11-17)
- [ ] idea: parents who learned from their own grown children expect ~0.1 of a grown child,
      strongest-tie parents ~0.6 (exp014); revisit if parental weight matters to a result
- [ ] idea: further output measures (ODD §4.10); a research question for later
- [ ] idea: the trickle-down note (ODD open questions 2), revisit when capital is built
- [ ] idea: water is sparse (rivers, lakes, springs only; ~6% of hexes); check against
      band placement in Stage 7, maybe more springs or seasonal ponds
- [x] fix: re-balance the numbers raised for solitary survival in Stage 2 (plants r 0.1, cap
      40, 6 units/h; rot 1%/day; Keep 20 days at 0.97) once agents can share, against the
      foundation forming, not against a loner surviving (Chris, 2026-11-02) (done in 5g: those
  numbers are gone, rebalanced against bands)
- [x] perf: planner cost rose 0.23 → 0.8–1.3 ms per agent-day with craft/quarry candidates and
      object copies in the cost functions (~35–60 min per generation at 300 agents); profile
      and trim (habit as a cached plan, ODD §7.6; fewer allocations)
- [ ] feat: trade reliability per place (ODD §7.6 says reliability at places on the route; one
      per agent for now), so markets as places can emerge (ODD §4.7)
- [ ] idea: forgetting is the expected value of the daily chance; switch to the random draw if
      the variance matters
- [ ] feat: measure survivorship bias in norms once rates differ between agents (Stage 3
      Done-when, second half)
- [ ] idea: log slack and tinkering hours; scarcity that removes slack should slow discovery
      (ODD §7.3), and it bears on the results (tinkering hours are now counted per world;
      not yet sampled against slack)
- [x] fix: the Keep projection is rosier than the winters agents live (projected fire every
      night; lived winter warmth 0.4–0.6). ODD §7.6 says expected future need comes from
      seasonal norms; consider projecting from experienced seasonal outcomes
- [ ] feat: tinkering's success rate is the agent's own record only; ODD §4.4 says norms pool
      others' experience (chat could carry it)
- [ ] idea: crafts are practised only at home and few agents share a home hex, so know-how
      spreads slowly by seeing; revisit when households share shelters (Stage 6)
- [ ] idea: "huts started" counts a restart after a lapse as a new start; split new projects
      from restarts if the measure matters
- [x] perf: 5b raised the cost again (~0.9 ms per agent-day in the smoke measure, ~2 ms in the
      bands runs with tinkering and builds); same remedy as the perf item above
- [ ] idea: the half-per-week fade of a food gap in the projection (`keepPersist`) is a set
      number; learn it from the agent's own week-to-week food levels
- [ ] fix: the route search still misses a better plan with a drink on some thirsty mornings
      (46 in 400 days; the lethal-night cost keeps it from killing). A swap move, or seeding the
      greedy with a drink when water is low, would close it
- [ ] idea: since the calibration the first barter comes on day 49, not day 3; check why
      (early valuations under lived inflows) before Stage 7 measures trade
- [ ] idea: fires are lit on ~20% of winter evenings; a wood store is cheap insurance. Watch
      whether storing wood rises once lived winters are learned (year 2+)
- [ ] perf: the year-long projection raised the cost again (~1.6 ms per agent-day in bands
      runs, ~0.9 in the smoke measure; ~70 min per generation at 300 agents). Candidates:
      fewer trade-arm variants in the route build, coarser far steps
- [ ] idea: the return through others is tiny so far (a few grain a year); watch it as
      farming spreads and ties carry grain gifts
- [ ] idea: farming takes about three years to start from nothing; the binding limit is
      seed held through winter. Note it when burn-in length is set (Stage 7)
- [x] feat: water as an exchange good, up to the room in the receiver's gourd and pot (Chris,
      2026-11-03)
- [ ] perf: planning is 83% of run time and its cost grows through a run (0.47 ms per
      agent-day in days 1–120, 1.2 by days 600–720) as agents hold and know more; exchange
      is 12%. Candidates: coarser far projection steps, caching the projection for unchanged
      holdings, fewer candidates. (A "water tripled barter cost" reading on 2026-11-03 was
      two runs sharing the machine; measured alone, two years went 0.71 → 0.86 ms with fix 1,
      water in exchange and the partner cap.)
- [x] feat: bands move camp (ODD §5, Chris 2026-11-03): weighed weekly by the members' summed
      day costs at shortlisted sites; each member follows, stays or joins another camp. Two
      years: 98/100 alive vs 87 fixed; bands scatter in the first spring (no ties yet) and
      re-form by day 180
- ~~perf: weighing camps doubles run time (3.4 vs 1.65 ms per agent-day, two years).
      Candidates: fewer shortlisted sites, members' stay cost reused from the morning plan,
      skipping a weighing when the shortlist has not changed~~ → **Stage 6**
- [x] feat: huts and lean-tos are things in the world, anyone may use one (Chris,
      2026-11-03); a planter knows its own field ripens; chat passes on ripe grain; fields
      beyond half a day's reach drop out of the projection's harvest
- [x] feat: a hut shelters 5 and a lean-to 2, beds chosen each evening by warmth then ties
      (Chris, 2026-11-03); huts fill, and 80–95% of sleepers helped build
- [x] idea: nothing given, seed 1: a merged camp of ~40 lost 15 to hunger in year 3 (83/100
      alive vs 98 with one agent per structure). Check across seeds whether merged camps
      outgrow their land; the move rule sums costs but nothing weighs camp size directly.
      Traced 2026-11-09 (no tech, seed 2, year 27, scratchpad ct27_2.txt): two camps (80 and 76
      adults) picked the same site in late spring and merged into ~300 people. The merged camp
      moved weekly as one, stripped each site within a week, hit thirst in summer (22 dead),
      and starved through autumn, ending at about 10. A camp of 41 adults elsewhere lost
      nobody and stored up to 180 days a head. `siteDay` scores a site as one member's best day
      on the land as they saw it, repeated for six days, whatever the camp's size; a member can
      only follow, stay, or join a camp within a day's walk, so the big camp never split.
      Addressed 2026-11-10 by crowding in the forecast (Stage 6): no tech, seed 2, 40 years,
      308 alive vs 161
- [x] feat: every learned value keeps a habit, a norm and a score of which pays off; the
      agent blends by the scores (ODD §4.4, Chris 2026-11-03 "fix 2"). Seasonal flows,
      evening food, working day and sowing return are now told in chat
- ~~idea: fix 2 can only show its point (knowing winter before living one) once ages
      overlap; check it when births land (Stage 6)~~ → **Stage 6**
- [ ] idea: run-to-run variation is now the bottleneck for reading results (survival 83 →
      100, farming 155 → 2 seeds across this session's changes, one seed each). A multi-seed
      measure before any further claim
- ~~perf: camps weighing is 45% of run time (120-day profile, 2026-11-03)~~ → **Stage 6**
- [x] fix: the told-norm rate slowed to the habits' rate (0.05) and the working day learns at
      the same rate (Chris, 2026-11-04, "fix 1 and 2"); seed 1's bands year lost 19 to hunger
      with the slower told rate (100/100 at 0.2), seeds 2 and 3 unaffected, cause undiagnosed
- [ ] idea: diagnose seed 1's first-winter hunger under the slower told rate (projected vs
      lived winter food, 0.05 vs 0.2); Chris accepted the fix as is (2026-11-04)
- [x] ~~fix: the UI charts looked sparse at day 45~~ not a bug: they sample every 10 days and
      show a whole three-year run, so at day 45 the lines span the first 4 of 108 points
- [ ] idea: with farming known, mobile bands sowed 12 seeds in three years against 115 with
      fixed homes (seed 1, one run each). Check across seeds before reading it as the
      foraging vs farming trade-off
- ~~fix: carrying has no limit when a camp moves; ties to containers (5e)~~ → **5h**
- [ ] idea: the initial state may need work (Chris, 2026-11-03: "we can leave it for now"):
      with no ties at the start, bands scatter in the first spring and re-form by day 180
- [x] fix: late-winter squeeze: the three-year deaths (8, 1, 9) all come at winter's end, when
      roots near camp are dug down and stores run out; check after Stage 6 changes the mix.
      Done 2026-11-07: roots 1000 → 2000 per land. 4 years, seeds 1–3: 127 / 135 / 118 alive
      (was 66 / 75 / 45); ×1.5 mixed, nuts ×2 no help. 20 years: 124 / 96 / 128 (was 18 / 25 / 41)
- [ ] check: the second generation starts having children only from about year 17, so the
      Done-when needs runs of 40+ years; births fall to 1–6 a year in years 13–20 as the
      starting women pass 45
- [ ] check: members joining another camp total ~150–165 in 4 years and the same in 20, so
      joins (moving or staying camps) nearly stop after the first years; see whether leaving a
      camp that stays ever fires later
- [ ] idea: famines still come in years 9–10 (22–28 children dead) when children nearly match
      adults, before any child has grown up; a spin-up age structure
- [ ] idea: roots and tree cover decline under use (0.21 → 0.165, 0.354 → 0.302 over three
      years, mostly firewood); watch in longer runs, emergent not imposed
- [ ] feat: the trade arm in `holdingsCost` weighs one main food against wood; generalize to
      the food kinds
- [ ] idea: `priorPerHour` per food is a hand choice (about the old prior's food each season);
      replace with the prior from experience when Stage 6 builds it
- [ ] perf: barter is a third to a half of run time in winter (every partner × every pair of
      16 goods, lotGain projecting both sides); trim before long generation runs
- [ ] fix: a camp that strips the greens around it in spring starves rather than moving
      (seed 1, band 5: 5–10 dead by day 62; greens are spring's only wild food and picked-bare
      hexes stay empty until next year); see why camp weighing does not move it. Same in
      autumn (seed 2, year 4, 2026-11-06): a camp of 28 stored ~20 days a head against 50–125
      in the others, moved once late, stripped the new site in five weeks and starved beside a
      camp of 9 holding ~75 days a head. A member's own choice to join another camp is weighed
      only once its camp has decided to move (`campsDay`), so it never comes up
- [ ] idea: the spin-up synchronizes the first birth cohort (35 of ~50 women pregnant or
      nursing in seed 3's year-2 autumn). Removing care hours there cut adult deaths 40 → 2,
      and removing nursing food cut them 40 → 16 (one run each)
- [ ] idea: women die in late winter while pregnant (15 of 24 deaths in one run); the return
      on a child is in hours and does not see the risk to her. 40 years, seeds 1–3: women are
      37 / 34 / 21 of 94 / 77 / 73 adults, and seed 3 is flat with 1–6 births a year
- [ ] check: the 40-year runs (2026-11-07, seeds 1–3) persist: 193 / 162 / 115 alive, second
      generation matured and bearing. "Several generations" needs 60+ years
- [ ] check: the static server on :8000 did not answer on 2026-11-06, so the new charts are
      unchecked in the browser
- [ ] check: with discovery off (stone tools only), 40 years, seeds 1–3 (2026-11-09,
      scratchpad nt40_*): near-zero deaths for 20+ years, 286 / 302 / 324 alive at year 20 (vs
      124 / 96 / 128 with discovery), women half the adults; then camps of ~100 overshoot (seed 2
      lost ~300 of 391 in year 27, hunger and thirst; seed 3 ~100 in years 30–31). Which
      know-how costs lives is untested: add one item at a time to the start set
- [x] check: what tech costs (2026-11-09, scratchpad roi2.mjs, roi_t*/roi_n*, 8 years, seeds
      1–3, means per adult-day): with discovery vs without, busy 7.8 vs 6.5 h for the same food
      (1.66 vs 1.67 days' food gathered). Tech work 0.53 h, of which tinkering 0.30 (still
      0.17–0.42 in year 8); travel 4.3 vs 3.4 h; food per food-hour 0.65 vs 0.77; wood 0.34 vs
      0.73 h; warmth 0.88 vs 0.75. Nothing sown or reaped in 8 years in any seed. Untested
      guess for the travel: huts hold camps near stripped land. Confirmed and fixed
      2026-11-10 (forecast held the shelter fixed and was blind to the site's land; Stage 6).
      After (roiF_*): busy 6.8 vs 6.3 h, food 1.91 vs 1.93, travel 3.3 vs 3.1, warmth 0.80
      vs 0.72. Tech still buys warmth, not food
- [ ] check: winter and huts (2026-11-11, scratchpad hutprobe.mjs, seed 3 tech colony at year
      40): of 17 finished huts none is slept in through winter; camps sit on bare ground at
      root sites, and people start new huts while finished ones stand. Huts are used mainly
      in autumn, one site of 11. Unknown whether winter food outweighs warmth or the forecast
      underprices cold
- [ ] check: 40 years, seeds 1–6, new forecast (scratchpad rf40t_*/rf40n_*): tech 375 / 339
      / 452 / 356 / 398 / 150, no tech 498 / 308 / 410 / 348 / 362 / 290; old code tech 193 /
      162 / 115 / 213 / 58 / 195. Seed 6 with tech lost 50 to hunger in year 40, untraced.
      Camp moves ~45 per 100 people a year (old ~38)
- [ ] idea: camp joins (`world.campJoins`) are counted but not charted (moves are); add a
      series if leaving a camp that stays needs watching
- [x] feat: the experiment data protocol (conventions §4; 2026-11-13): `exp.mjs`, `EXPLOG.md`,
      numbered experiments in Mongo `evoeco.expNNN_<slug>` and `results/expNNN_<slug>/`
- [ ] idea: the old-age hazard (Gompertz) runs at every age, so a few children die of "old age";
      harmless, but relabel or floor it if child deaths by cause are reported
- [ ] chore: exp002's twelve saved colonies take ~580 MB in `results/`; keep the y10/y30 ones
      exp003–005 start from, drop the rest if disk matters
- [ ] perf: `giftsAt` now weighs each receiver's gift again after any gift by the same giver;
      watch the exchange share of run time in long runs
- [ ] fix: four young men died of thirst on the same day, fed and unhurt (exp007 s1, year 4.08);
      untraced, likely a party out without water
- [ ] idea: hunger deaths come mostly in winter and early spring (exp007), in clusters that take
      men without children too; trace a cluster against camp stores and moves
- [ ] fix: a colony's saved parameters override current defaults on load (colony.mjs), so a run
      from an old colony silently keeps old values; probes take `--set`, but the runner does
      not, and nothing warns
- [ ] idea: if the mothers' deaths matter to a result, the lever is the weight on a child or a
      mother's own margin (stores, hours), not the gift sum's shape (exp009–011)
