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
    winterGrowth: 0.2,  // least plant growth factor (autumn and winter)
  },

  // --- resources (ODD §2: one mechanism — cap, regrowth, inflow — for every class) ---
  // kind: 'renewable' regrows logistically toward cap (seed floor so a stripped hex recovers
  //       slowly); 'flow' refills each day by inflow × the seasonal rain factor; 'deposit'
  //       never regrows (non-renewables).
  // season: 'growth' (regrows spring–summer only), 'rain', or 'none'.
  // capBy: units per hex by terrain.
  resources: {
    plants: { kind: 'renewable', r: 0.1, floor: 0.05, season: 'growth', capBy: { plains: 400, forest: 160, hills: 120 } },
    wood:   { kind: 'renewable', r: 0.004, floor: 0.1, season: 'growth', capBy: { forest: 200, plains: 10, hills: 20 } },
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
    plants: { perHour: 6 },   // units gathered per hour from a full hex (falls with stock)
    wood:   { perHour: 4 },
    flint:  { perHour: 1 },   // by hand; a pick doubles it
    clay:   { perHour: 3 },   // dug by hand from a bank
    food:   { restores: 0.08, cookedBonus: 1.5, rot: 0.01 },  // per unit of wild plants (nuts and roots keep, berries don't); rots daily
    gourd: 0.5,               // water carried home (in need units)
    drinkDraw: 1,             // water units taken from the source per drink
    fireWood: 2,              // wood burned per evening fire
    fireHeat: 0.35,           // warmth a fire adds
    // structures (inputs and hours in tree.js BUILDS): warmth, daily wear; an unfinished hut
    // weathers at partWear a day
    leanTo: { insulation: 0.45, wear: 0.01 },
    hut:    { insulation: 0.8, wear: 0.002, partWear: 0.003 },
    pot:    { cap: 2, wear: 1 / 300 },   // water stored (need units, beside the gourd); breakage a day
  },

  // --- agents (Stage 2: solitary; ODD §2 Agents, §4.4, §7.6) ---
  agents: {
    layout: 'bands',      // 'bands' (ODD §5, Decided) or 'scattered' (tests)
    n: 20,                // agents when scattered
    // bands a day or two apart; homes within `radius` hexes of the band centre. No ties or
    // households are pre-built, only nearness (ODD §5)
    bands: { n: 5, size: 20, spacing: 14, radius: 2 },
    startAgeYears: 20,
    starterFood: 15,      // burn-in scaffold (ODD §5): food in hand on day 1
    wakingHours: 14,      // hours for travel, work and rest each day
    sight: 2,             // hexes known around home at the start
    // death: days at zero before it kills; old age: Gompertz hazard per year, work declines
    deathDays: { food: 20, water: 3, warmth: 5 },
    oldAge: { gompertzA: 0.0003, gompertzB: 0.08, declineStart: 50, declineSpan: 30, floor: 0.3 },
    // planning (ODD §7.6)
    maxStops: 3, chunk: 2, drinkHours: 0.25, scoutHours: 0.5,
    topPerActivity: 4, maxGreedySteps: 8, scoutCandidates: 8,
    horizon: 120,         // days of Keep projection (a good is valued over its storage life)
    keepStep: 7,          // days per projection step
    // the projection assumes this many hours a day of foraging and wood-cutting at the yield
    // the agent has learned for that season (ODD §7.6: expected future need from seasonal norms)
    projHours: { forage: 3, wood: 1, build: 3 },
    discount: 0.99,       // per day; swept (ODD §7.6)
    // learning and curiosity (ODD §4.4)
    learnRate: 0.3,
    // meeting and chat (ODD §4.4, §4.6)
    chatK: 5,             // people chatted with per day, of those met
    normRate: 0.2,        // error-driven update of norms from others' reported experience
    normPrior: 3,         // weight of the norm against the agent's own habit (precision weighting)
    habitCap: 20,         // most experiences a habit counts, so recent reliability rules
    priorPerHour: { forage: 3, wood: 3, quarry: 1, dig: 3 },  // starting guess of the yield per hour from a full hex
    sightSd: 0.5,         // uncertainty (in fullness) of a sighting once it is old
    sightMemory: 30,      // days for a sighting to grow most of that uncertainty
    curiosity: 1.0,       // optimism per sd of uncertainty
    scoutValue: 0.005,    // bonus per unseen hex a scouting stop would reveal
    // tinkering and know-how (ODD §7.3)
    tinkerHours: 2, tinkerCandidates: 3,
    discoverPerHour: 0.003,  // chance an hour of tinkering finds a level whose inputs are all at hand
    tinkerPrior: { found: 1, mh: 20 },   // hopeful prior: discoveries per material-hour
    tinkerValue: 0.02,    // value of an expected discovery (the curiosity term)
    seeLearn: 0.3,        // chance of learning a craft from seeing it practised once
    projectPrior: 2,      // pseudo-count of finished projects behind the chance of finishing
  },

  // --- exchange (ODD §2 Ties, §7.1, §7.2) ---
  exchange: {
    tradeWeight: 0.5,     // a barter's weight in the kindness tally, vs 1 for a gift; swept incl. 0
    tallyMemory: 60,      // days for a tally to fade by 1/e
    forget: 0.01,         // daily chance of forgetting an unreturned gift (per agent; a setting)
    owedLimit: 3,         // unreturned gifts beyond which it stops giving (a grudge)
    belongingSet: 5,      // tie strength that meets the belonging need
    priceRate: 0.2,       // error-driven update of the price norm
    relRate: 0.1,         // update of how reliably its trades come off
    maxLots: 30,          // lots per trade
    marginalLot: 1,       // units used to measure a good's marginal value to need
    hoursBaseline: 1e-4,  // weight of plain hour costs in a limit (decides when needs are flat)
  },

  // --- engine ---
  updatesPerDraw: 1,    // fast-forward: days per rendered frame

  // --- data collection ---
  reportingPeriod: 10,  // sample every N days
  epoch: 1080,          // a run ends (and ships a packet) after N days (3 years)

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
