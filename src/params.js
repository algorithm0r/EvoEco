'use strict';
// Single source of truth for every tunable. Serialized verbatim into every saved data
// packet (see datamanager.js) so any run reconstructs from its stored parameters.
// Numbers are first guesses, balanced as we go (CLAUDE.md); a change gets a DEVLOG line.
// Declared `var` so it's a global in the browser AND headless.
var PARAMETERS = {
  seed: 1,              // one seed drives map generation and every random draw

  // --- map (ODD §2 Landscape: generated hex grid, a hex ≈ an hour's walk) ---
  map: {
    width: 64,          // hexes across
    height: 48,         // hexes down
    noiseScale: 0.12,   // lattice cells per hex for elevation/moisture noise (lower = bigger features)
    octaves: 3,
    lakeFrac: 0.04,     // lowest fraction of cells by elevation become lake
    hillFrac: 0.22,     // highest fraction become hills
    forestFrac: 0.35,   // wettest fraction of the remaining land becomes forest
    nRivers: 6,         // rivers traced downhill from springs in the hills
    riverSpacing: 8,    // minimum hexes between river sources
  },

  // hours to cross one hex of each terrain; -1 = impassable (ODD §2: travel weighted by terrain)
  terrainHours: { plains: 1.0, forest: 1.5, hills: 2.0, river: 2.0, lake: -1 },

  // --- seasons (ODD §2 Scales: a year of days, so harvests vary and stores matter) ---
  year: {
    days: 360,
    rainAmplitude: 0.5, // water flow swings ±50% over the year, wettest in spring
  },

  // --- land and plant cover (ODD §2 Plant kinds share a hex's land; Stage 5g) ---
  // Each cover is a share of the hex's land. In the growing season each spreads into bare land
  // at `r` a day (from a seed floor, so a stripped cover comes back), and trees take grass and
  // root land at `shade` a day times the hex's tree edge (wet land only). Open land drifts back
  // toward its natural mix of grass and roots (`open`) at `mix` a day, so dug roots come back
  // over years.
  land: {
    size: { plains: 1, forest: 1, hills: 0.5 },   // land per hex by ground (forest stands on plains ground)
    grass: { r: 0.1, floor: 0.02 },
    roots: { r: 0.03, floor: 0.02 },
    trees: { r: 0.01, floor: 0.02, shade: 0.02 },
    open:   { grass: 0.65, roots: 0.3, trees: 0.05 },   // start cover on land without a tree edge
    forest: { grass: 0.05, roots: 0.05, trees: 0.9 },   // start cover on wet land
    mix: 0.01,
    landPerSeed: 0.001,   // share of a hex's land a seed of grain takes when sown
  },

  // --- resources (ODD §2: one mechanism — cap, regrowth, inflow — for every class) ---
  // kind: 'crop' is the season's whole crop, ripe on its cover when its season opens
  //       (`season`: from–to as shares of the year), the cover's share of `perLand`; picking a
  //       hex bare empties it for the season, what is left at the season's end is gone, and
  //       taking it leaves the plants (ODD §2, Stage 5g, Decided).
  //       'plant' is the cover itself, `perLand` units on a hex's land under full cover: taking
  //       it shrinks the cover. Gathered only in `season`, if given.
  //       'renewable' regrows logistically toward cap (seed floor so a stripped hex recovers
  //       slowly); 'flow' refills each day by inflow × the seasonal rain factor; 'deposit'
  //       never regrows (non-renewables).
  // perHour: units gathered per hour from a full hex (falls with fullness).
  // season (renewable and flow): 'rain' or 'none'. capBy: units per hex by terrain.
  resources: {
    greens: { kind: 'crop', cover: 'grass', perLand: 1200, season: [0, 0.25], perHour: 14 },   // quick to pick; rot in days
    seeds:  { kind: 'crop', cover: 'grass', perLand: 900, season: [0.25, 0.5], perHour: 6 },  // the wild grain
    nuts:   { kind: 'crop', cover: 'trees', perLand: 1200, season: [0.5, 0.75], perHour: 6 },
    roots:  { kind: 'plant', cover: 'roots', perLand: 2000, season: [0.5, 1], perHour: 12 },   // slow to dig; the winter food (1000 → 2000, 2026-11-07: camps of 20 starved in early winter)
    wood:   { kind: 'plant', cover: 'trees', perLand: 200, perHour: 4 },
    soil:   { kind: 'renewable', r: 0.01, floor: 0.2, season: 'none', capBy: { plains: 6, forest: 6, hills: 2 },
              floodplainBonus: 2, floodplainRange: 1 },  // fertile land near water
    water:  { kind: 'flow', inflow: 1.0, season: 'rain', capBy: { river: 60, lake: 100 }, spring: 30 },
    flint:  { kind: 'deposit', deposit: 400, clusters: 8, radius: 1, fill: 0.6, on: ['hills'], bankFrac: 0.1 },  // hills, and cobbles in river gravels
    clay:   { kind: 'deposit', deposit: 300, bankFrac: 0.35 },  // on land next to river or lake
    copper: { kind: 'deposit', deposit: 300, clusters: 2, radius: 1, fill: 0.5, on: ['hills'] },
    tin:    { kind: 'deposit', deposit: 150, clusters: 1, radius: 0, fill: 1, on: ['hills'],
              distanceFromCopper: 25 },  // hexes; ODD §2: tin far from the copper (Cline 2014)
    iron:   { kind: 'deposit', deposit: 400, clusters: 3, radius: 1, fill: 0.5, on: ['hills', 'forest'] },
    // small game (ODD §2 Game, Stage 5h): meat on the hoof, the ceiling per hex by terrain;
    // breeds, seeps and is eaten by its predator in game.js
    smallgame: { kind: 'game', capBy: { plains: 600, forest: 600, hills: 300, river: 300 }, perHour: 4 },   // 8 made it 3/4 of the diet (2026-11-11)
    // the first material tree (ODD §2 Containers and carrying, Decided 2026-11-12): wild gourd
    // vines, thickest by water, ripe in late summer; fibre (reeds and bark) to plait, growing
    // back, thickest by water
    gourds: { kind: 'crop', cover: 'grass', perLand: 10, floodplainBonus: 3, floodplainRange: 1, season: [0.5, 0.75], perHour: 2 },
    fibre:  { kind: 'renewable', r: 0.02, floor: 0.2, capBy: { plains: 15, forest: 30, hills: 5 }, floodplainBonus: 2, floodplainRange: 1, perHour: 4 },
  },

  // --- game (ODD §2 Game, Decided — Chris, 2026-11-11; numbers Default, game.js) ---
  game: {
    weatherSd: 0.2,       // year-to-year spread of small game's breeding (lognormal)
    // small game, as fullness of its ceiling: breeding a day at the height of the growing season
    // (about 2 a year), the seed floor, the start, and the share of a fullness difference that
    // seeps across an edge a day
    small: { r: 0.018, floor: 0.02, start: 0.6, seep: 0.05 },
    // its predator, as a load (1 = usual): take p·x/(x + H) a day, shared out by 1 + c·load
    // (the damping), growth e per unit taken, death m a day; a floor so it can come back
    pred: { p: 0.0034, H: 0.3, c: 0.5, e: 0.98, m: 0.0014, floor: 0.01, start: 1, seep: 0.03 },
    // herds' grazing, in animal-days per unit of land under full grass or trees; regrowth a
    // day; the share of browse regrowth that goes on through autumn and winter
    graze: { grass: 300, browse: 100, r: 0.05, browseAllYear: 0.5 },
    // herds: how many at the start and their size; the ceiling on all big game; steps a day;
    // the pull of water and the push of the pack and people traces (per unit of trace); chance;
    // births a day at the height of the season when fed and with room; background death a day;
    // death a day when unfed; the update of how fed; split size; fewest herds before
    // animals come in from beyond the map, and the daily chance they do
    herd: { n: 24, start: 60, ceiling: 4000, steps: 2, water: 0.3, avoidPack: 0.5, avoidPeople: 0.1,
            wander: 0.05, birth: 0.0061, die: 0.00028, starve: 0.01, fedRate: 0.05, split: 120, min: 4, arrive: 0.01 },
    // packs: how many and their size; steps a day; how far they scent a herd (hexes); the least
    // rise in the herd trace they follow; the daily chance of turning while ranging; the take a
    // day per wolf per animal of the herd it is on; herd animals per wolf the numbers drift
    // toward, the share of the gap closed a day, the sd of the yearly draw on that; and as herds
    pack: { n: 6, start: 6, steps: 3, sense: 3, minTrace: 0.05, turn: 0.2, take: 0.0009,
            perWolf: 50, track: 0.003, sd: 0.2, split: 14, min: 2, arrive: 0.01 },
    // traces: fading a day and seeping to neighbours a day, by kind; what one person leaves on a
    // hex it was at today
    trace: { fade: { herd: 0.15, pack: 0.15, people: 0.3 }, seep: 0.1, person: 0.1 },
  },

  // --- injury (ODD §2 Game: risks all people face, Decided — Chris, 2026-11-11; numbers Default) ---
  injury: {
    // chance of an injury: a day in camp, and an hour out of camp, hunting big game, building
    camp: 0.0002, out: 0.00005, hunt: 0.0004, build: 0.0002,
    herdScale: 60,        // big game's risk scales with the herd's size against this (within ×0.5–×2)
    shares: { minor: 0.85, major: 0.12, death: 0.03 },   // what an injury turns out to be
    minorDays: 10,        // days a minor injury takes to heal
    minorCut: 0.3,        // share of its working hours a hurt agent keeps while it heals
    majorCut: 0.3,        // share of its working hours a major injury takes for life
    dayCost: 0.5,         // the forecast's cost of a day's work lost (need-cost units)
    learnRate: 0.01,      // update of the learned rates, a day (injuries are rare)
  },

  // --- hunting big game (ODD §2 Game, Stage 5h; numbers Default) ---
  hunt: {
    signFull: 3,          // herd trace at which a hex reads as a herd for sure (sign 1)
    memory: 4,            // days for a sighting of sign to give way to where herds usually are
    seasonRate: 0.1,      // update of where herds usually are, per hex and season, from sightings
    candidates: 6,        // hunting stops a planner weighs: the best by sign for the walk
    pKill: 0.2,           // chance an hour on a big herd, bare-handed, of a kill
    findH: 20,            // herd size at which a hunter finds the animals in the hex half as often
    party: 1,             // how much each hunter's chance rises with others on the herd (to 1 + party)
    partyScale: 2,        // others on the herd at which most of that rise is had
    carcass: 100,         // meat in one big animal
    learnRate: 0.05,      // update of the learned meat per hour (kills are lumpy)
    minTrace: 0.05,       // least rise in the herd trace a hunter follows
    hide: 1,              // hides in one big animal (ODD §2 Containers and carrying, Decided 2026-11-12)
    smallHide: 0.02,      // hide's worth of small skins per unit of small game's meat
  },

  // --- snares (ODD §2 Game, the hunting ladder's first rung; numbers Default) ---
  snare: {
    perHour: 6,           // snares set in an hour
    most: 12,             // snares one owner keeps in a hex
    catch: 0.2,           // meat a snare takes a day from a full hex
    wear: 0.02,           // share of the snares lost a day
    candidates: 3,        // snaring places a planner weighs (its own snares first)
    learnRate: 0.1,       // update of the learned catch per hour of tending (it comes in lumps)
  },

  // --- carrying (ODD §2 Containers and carrying, Decided — Chris, 2026-11-12): one load by
  // weight, a cap per kind in bare hands that gear raises toward the load; kg a unit of each
  // carried good (tools and gear go in hand); carried children's weight by age (infant, under
  // helpAge, older); food burned a day per kg carried per hour walked ---
  carry: {
    load: 25,
    bare: { loose: 1, bulky: 10, water: 0 },
    weight: { greens: 1, grain: 0.4, roots: 0.5, nuts: 0.5, driedGreens: 0.3, roastedNuts: 0.5, meal: 0.3,
              meat: 0.5, driedMeat: 0.25, wood: 2, flint: 1, clay: 2, water: 4, pot: 4,
              gourdFruit: 1, driedGourd: 0.3, hide: 5, leather: 2, fibre: 1 },
    child: [8, 4, 0],
    burn: 0.0004,
    fetchHours: 0.25,     // taking up goods lying somewhere (ODD §2 Fetching is moving camp in more than one trip)
  },

  // --- needs (ODD §2 Needs: levels in 0..1, set point 1, convex cost) ---
  needs: {
    foodDecay: 0.3,     // food level lost per day
    workBurn: 0.02,     // extra food lost per hour of travel and work (ODD §4.3: work burns food)
    waterDecay: 0.5,    // water level lost per day
    restSet: 6,         // free hours a day that meet the rest need
  },

  // --- goods (ODD §2 First tree v0, levels 0–1 only in Stage 2) ---
  goods: {
    flint:  { perHour: 1 },   // by hand; a pick doubles it
    clay:   { perHour: 3 },   // dug by hand from a bank
    // foods (Stage 5g): food per unit, the factor cooking on the fire adds, daily rot. Eaten
    // fastest-rotting first. Processed foods are made at home (tree.js PROCESSES)
    greens:      { restores: 0.05, cookedBonus: 1.2, rot: 0.15 },
    roots:       { restores: 0.08, cookedBonus: 1.5, rot: 0.005 },
    nuts:        { restores: 0.12, cookedBonus: 1.2, rot: 0.003 },
    driedGreens: { restores: 0.15, cookedBonus: 1.2, rot: 0.004 },   // three units of greens dried
    roastedNuts: { restores: 0.14, cookedBonus: 1, rot: 0.001 },
    meal:        { restores: 0.12, cookedBonus: 1.5, rot: 0.003 },   // ground seeds: cooked on the fire, no pot
    meat:        { restores: 0.1, cookedBonus: 1.5, rot: 0.15 },     // game (Stage 5h): rots about as fast as greens
    driedMeat:   { restores: 0.2, cookedBonus: 1.2, rot: 0.004 },    // two units of meat dried
    // gear (ODD §2 Containers and carrying, Decided 2026-11-12): water each vessel holds (need
    // units) and daily wear; a gourd fruit dries in about `dryDays` where it is kept
    gourd:     { cap: 0.5, wear: 1 / 400, dryDays: 21 },
    waterskin: { cap: 2, wear: 1 / 300 },
    bag:       { wear: 1 / 300 },
    basket:    { wear: 1 / 200 },
    drinkDraw: 1,             // water units taken from the source per drink
    fireWood: 2,              // wood burned per evening fire
    fireHeat: 0.35,           // warmth a fire adds
    // structures (inputs and hours in tree.js BUILDS): warmth, daily wear; an unfinished hut
    // weathers at partWear a day
    // sleepers: how many a structure shelters (a hut once begun; ODD §5, Default)
    leanTo: { insulation: 0.45, wear: 0.01, sleepers: 2 },
    hut:    { insulation: 0.8, wear: 0.002, partWear: 0.003, sleepers: 5 },
    pot:    { cap: 2, wear: 1 / 300 },
    // grain and fields (Stage 5d): food per unit; cooked with fire in a pot (`potCook`); daily
    // rot; grain per seed at full fertility (soil stock ÷ soilFull); soil drawn per seed; work
    // rates by hand; ripening and closing day of the year; decay in the field once ripe; the
    // hopeful prior of grain back per seed at full fertility. Wild grain is the grass's seeds.
    grain:  { restores: 0.1, cookedBonus: 1.5, potCook: true, rot: 0.002, yieldPerSeed: 10, soilFull: 12, soilPerSeed: 0.02,
              sowPerHour: 4, reapPerHour: 8, sowDay: 30, ripeDay: 150, closeDay: 240, fieldDecay: 0.01, prior: 8 },
  },

  // --- agents (Stage 2: solitary; ODD §2 Agents, §4.4, §7.6) ---
  agents: {
    layout: 'bands',      // 'bands' (ODD §5, Decided) or 'scattered' (tests)
    n: 20,                // agents when scattered
    // bands a day or two apart; homes within `radius` hexes of the band centre. No ties or
    // households are pre-built, only nearness (ODD §5)
    bands: { n: 5, size: 20, spacing: 14, radius: 2 },
    startAge: [15, 45],   // years, uniform, at the start (ODD §5 Starting ages, Decided)
    // know-how at the start (ODD §5, Decided: no tech level known by default; gathering, fire
    // and the stone tools are assumptions). A variant adds levels: 'leanTo', 'pot', 'hut', 'farm'
    knowhow: ['axe', 'pick', 'hoe', 'sickle', 'spear', 'gourd'],   // the spear: ODD §2 Game, Decided 2026-11-11; the gourd: ODD §5 (made, Decided 2026-11-12)
    starterGourds: 1,     // burn-in scaffold (ODD §5): a gourd in hand on day 1
    starterFood: 15,      // burn-in scaffold (ODD §5): roots in hand on day 1
    wakingHours: 14,      // hours for travel, work and rest each day
    sight: 2,             // hexes known around home at the start
    // death: days at zero before it kills (food and water: the body's reserve below zero is
    // this many days of the daily need, ODD §2 Needs); old age: Gompertz hazard per year, work declines
    deathDays: { food: 20, water: 3, warmth: 5 },
    oldAge: { gompertzA: 0.0003, gompertzB: 0.08, declineStart: 50, declineSpan: 30, floor: 0.3 },
    // planning (ODD §7.6)
    maxStops: 3, chunk: 2, drinkHours: 0.25, scoutHours: 0.5,
    topPerActivity: 4, maxGreedySteps: 8, scoutCandidates: 8,
    horizon: 120,         // days of Keep projection (a good is valued over its storage life)
    keepStep: 7,          // days per projection step
    horizonFar: 360,      // the projection then runs on to a year (farming's cycle, Stage 5d)
    keepLongStep: 30,     // in steps of this many days
    // the prior for what a day brings in (hours of foraging and wood-cutting at the prior
    // rates, the foraging hours split among the foods in season)
    projHours: { forage: 3, wood: 1 },
    discount: 0.99,       // per day; swept (ODD §7.6)
    // learning and curiosity (ODD §4.4)
    learnRate: 0.3,
    flowRate: 0.05,       // update of the seasonal habits (what a day brings in, evening food, working day; a memory of ~20 days), and of norms told in chat
    keepPersist: 0.5,     // share of a gap from its usual food level the projection keeps a week on
    // meeting and chat (ODD §4.4, §4.6)
    chatK: 5,             // people chatted with per day, of those met
    normRate: 0.2,        // error-driven update of norms from others' reported experience
    arbRate: 0.1,         // update of how far habit and norm each miss its own experience (ODD §4.4)
    arbExtreme: 0.9,      // a weight beyond this becomes 1: one source alone
    priorPerHour: { greens: 5, seeds: 2.5, roots: 3, nuts: 2, wood: 3, quarry: 1, dig: 3, smallgame: 3, hunt: 4, snare: 4, gourds: 1, fibre: 3 },  // starting guess of the yield per hour from a full hex (below the truth: a few hours of foraging at it give ~0.7 food a day in any season)
    sightSd: 0.5,         // uncertainty (in fullness) of a sighting once it is old
    sightMemory: 30,      // days for a sighting to grow most of that uncertainty
    curiosity: 1.0,       // optimism per sd of uncertainty
    scoutValue: 0.005,    // bonus per unseen hex a scouting stop would reveal
    // tinkering and know-how (ODD §7.3)
    tinkerHours: 2, tinkerCandidates: 3,
    sowCandidates: 3,     // most fertile places within reach considered for sowing (Stage 5d)
    discoverPerHour: 0.003,  // chance an hour of tinkering finds a level whose inputs are all at hand
    tinkerPrior: { found: 1, mh: 20 },   // hopeful prior: discoveries per material-hour
    tinkerValue: 0.02,    // value of an expected discovery (the curiosity term)
    seeLearn: 0.3,        // chance of learning a craft from seeing it practised once
    projectPrior: 2,      // pseudo-count of finished projects behind the chance of finishing
  },

  // --- life cycle (ODD §2 Agents life cycle, §7.4 Births; Stage 6; numbers Default) ---
  life: {
    on: true,             // births; off: a fixed cohort that only ages and dies (tests)
    nurseAge: 2,          // years an infant lives on its mother's milk
    helpAge: 6,           // from here a child works at its carer's task, at a child's rate
    matureAge: 15,        // plans and works on its own
    fertile: { female: [16, 45], male: 16 },   // years (ODD §7.4 Fertility limits)
    month: 30,            // days between a woman's weighings of a child (ODD §7.4)
    conceive: 0.2,        // chance a month's trying conceives (ODD §7.4, the human rate)
    pregnancyDays: 270,
    lateDays: 90,         // the last part of pregnancy: more food needed, fewer hours
    lateFood: 0.15,       // extra share of the daily food need, late in pregnancy
    lateHours: 2,         // hours a day fewer, late in pregnancy
    milkFood: 0.25,       // extra share of the mother's daily food need per infant nursed
    careHours: [2, 1, 0.5],   // hours a day from the carer's rest: infant, child under helpAge, older child
    childFood: [0.4, 1],  // a child's food need as a share of an adult's, at nurseAge and at matureAge
    childRate: [0.25, 1], // a child's work rate as a share of an adult's, at helpAge and at matureAge
    survivalPrior: { died: 1, years: 52 },   // before any are seen: 1 death in 52 child-years (3 in 4 grow up)
    startWait: 3,         // years over which each starting woman's first chance to conceive is spread (ODD §5)
  },

  // --- moving camp (ODD §5, Decided — Chris, 2026-11-03; numbers Default) ---
  camp: {
    move: true,           // bands move camp as a group; off: homes fixed near the band centre
    every: 7,             // days between a camp's decisions (the days a move is weighed over)
    sites: 5,             // sites shortlisted, by how full the members saw the land around them
    look: 2,              // hexes around a site that the shortlist looks at
    thinRate: 0.3,        // update of the learned thinning per camper (ODD §5 Crowding enters the forecast), once a week
    landRate: 0.3,        // update of how full the land around camp usually is (ODD §5 A site's forecast prices rebuilding and its own land), once a week
    warmer: 0.05,         // insulation by which a bed counts as noticeably warmer
  },

  // --- exchange (ODD §2 Ties, §7.1, §7.2) ---
  exchange: {
    tradeWeight: 0.5,     // a barter's weight in the kindness tally, vs 1 for a gift; swept incl. 0
    tallyMemory: 60,      // days for a tally to fade by 1/e
    forget: 0.01,         // daily chance of forgetting an unreturned gift (per agent; a setting)
    owedLimit: 3,         // unreturned gifts beyond which it stops giving (a grudge), for a new tie
    tolerance: 5,         // kindness received that adds another owedLimit to the grudge limit (Stage 6)
    familiarity: 40,      // dealings that add another tallyMemory to how slowly a tie fades (Stage 6)
    belongingSet: 5,      // tie strength that meets the belonging need
    priceRate: 0.2,       // error-driven update of the price norm
    relRate: 0.1,         // update of how reliably its trades come off
    maxLots: 30,          // lots per trade
    partnersTried: 12,    // partners a holder tries at a place, known ones first (Chris, 2026-11-03)
    marginalLot: 1,       // units used to measure a good's marginal value to need
    hoursBaseline: 1e-4,  // weight of plain hour costs in a limit (decides when needs are flat)
  },

  // --- engine ---
  updatesPerDraw: 1,    // fast-forward: days per rendered frame

  // --- data collection ---
  reportingPeriod: 10,  // sample every N days
  epoch: 1080,          // a run ends (and ships a packet) after N days (3 years)
  measures: {
    strongTie: 2,       // a strong tie: each has had this many kind offers (faded) from the other
  },

  // --- database (the standard vendored client, src/db.js) ---
  db: {
    transport: 'socket',
    server: 'https://research.climbinggiants.com:8888',
    mongoUrl: 'mongodb://127.0.0.1:27017',
    db: 'evoeco',
    run: 'run',
  },
};

// Schema drives the auto-generated control panel (ui.js). One entry per live-tunable.
var PARAM_SCHEMA = [
  { key: 'seed', label: 'Seed', min: 1, max: 100, step: 1, resets: true },
  { key: 'agents.bands.n', label: 'Bands', min: 1, max: 8, step: 1, resets: true },
  { key: 'agents.bands.size', label: 'Band size', min: 1, max: 40, step: 1, resets: true },
  { key: 'updatesPerDraw', label: 'Days per frame', min: 1, max: 30, step: 1 },
];
