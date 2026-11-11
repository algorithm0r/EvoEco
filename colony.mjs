// Save and reload a colony (ODD §5 Spin-up, Default): a world run past its burn-in is written
// to a file and loaded as the starting state of experiments, so each one does not repeat the
// decades. Headless only (node's structured serializer keeps shared objects shared: a hut
// its sleepers point to, a camp and its members). The sim files must already be loaded into
// the global realm (as runner.mjs and smoketest.mjs do). PARAMETERS travel with the colony.
import { readFileSync, writeFileSync } from 'fs';
import v8 from 'v8';

export function saveColony(world, file) {
  const rng = world.rng, cache = world.travelCache;
  world.rng = { s: rng.s };          // the generator's state, not its code
  world.travelCache = null;          // rebuilt on demand
  try {
    writeFileSync(file, v8.serialize({ params: globalThis.PARAMETERS, world }));
  } finally {
    world.rng = rng; world.travelCache = cache;
  }
}

export function loadColony(file) {
  const { params, world } = v8.deserialize(readFileSync(file));
  // saved values over the current ones, key by key, so a parameter added since the colony was
  // saved keeps its default instead of going missing
  const merge = (t, s) => { for (const k of Object.keys(s)) { if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]) && t[k] && typeof t[k] === 'object') merge(t[k], s[k]); else t[k] = s[k]; } };
  merge(globalThis.PARAMETERS, params);
  Object.setPrototypeOf(world, globalThis.World.prototype);
  for (const a of world.agents.concat(world.dead)) Object.setPrototypeOf(a, globalThis.Agent.prototype);
  Object.setPrototypeOf(world.grid, globalThis.HexGrid.prototype);
  const rng = makeRngFrom(world.rng.s);
  world.rng = rng;
  world.travelCache = new Map();
  return world;
}

// a generator carrying on from a saved state
function makeRngFrom(s) { const rng = globalThis.makeRng(0); rng.s = s; return rng; }
