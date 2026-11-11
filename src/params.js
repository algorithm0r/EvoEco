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
    gourd: 0.5,               // water carried home (in need units)
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
    knowhow: ['axe', 'pick', 'hoe', 'sickle'],
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
    priorPerHour: { greens: 5, seeds: 2.5, roots: 3, nuts: 2, wood: 3, quarry: 1, dig: 3 },  // starting guess of the yield per hour from a full hex (below the truth: a few hours of foraging at it give ~0.7 food a day in any season)
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
