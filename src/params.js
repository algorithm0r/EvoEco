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

  // --- resources (ODD §2: one mechanism — cap, regrowth, inflow — for every class) ---
  // kind: 'renewable' regrows logistically toward cap (seed floor so a stripped hex recovers
  //       slowly); 'flow' refills each day by inflow × the seasonal rain factor; 'deposit'
  //       never regrows (non-renewables).
  // season: 'growth' (regrows spring–summer only), 'rain', or 'none'.
  // capBy: units per hex by terrain.
  resources: {
    plants: { kind: 'renewable', r: 0.06, floor: 0.05, season: 'growth', capBy: { plains: 20, forest: 8, hills: 6 } },
    wood:   { kind: 'renewable', r: 0.004, floor: 0.1, season: 'growth', capBy: { forest: 200, plains: 10, hills: 20 } },
    soil:   { kind: 'renewable', r: 0.01, floor: 0.2, season: 'none', capBy: { plains: 6, forest: 6, hills: 2 },
              floodplainBonus: 2, floodplainRange: 1 },  // fertile land near water
    water:  { kind: 'flow', inflow: 1.0, season: 'rain', capBy: { river: 60, lake: 100 }, spring: 30 },
    flint:  { kind: 'deposit', deposit: 400, clusters: 8, radius: 1, fill: 0.6, on: ['hills'] },
    clay:   { kind: 'deposit', deposit: 300, bankFrac: 0.35 },  // on land next to river or lake
    copper: { kind: 'deposit', deposit: 300, clusters: 2, radius: 1, fill: 0.5, on: ['hills'] },
    tin:    { kind: 'deposit', deposit: 150, clusters: 1, radius: 0, fill: 1, on: ['hills'],
              distanceFromCopper: 25 },  // hexes; ODD §2: tin far from the copper (Cline 2014)
    iron:   { kind: 'deposit', deposit: 400, clusters: 3, radius: 1, fill: 0.5, on: ['hills', 'forest'] },
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
  { key: 'updatesPerDraw', label: 'Days per frame', min: 1, max: 30, step: 1 },
];
