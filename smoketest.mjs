// No-DB sanity run. Checks the Stage 1 world (map, resources, seasons, travel) and the
// Stage 2 agents (survival, failure, learning, season, planner cost), and prints
// the numbers that belong in the DEVLOG entry (proof coupled to log). Exits non-zero on
// failure.
//   node smoketest.mjs
//
// Loads the SAME browser sim files into the MAIN V8 realm via indirect eval (NOT vm).
// Everything in src/ is `var` / `function` / `var X = class X`, so once the leading
// 'use strict' directive is stripped the top-level names attach to globalThis and read as
// fast native globals. Main-realm (not vm) because vm adds a ~7-10x hot-loop tax on per-tick
// global reads (e.g. PARAMETERS.*) and a one-config run never needs vm's isolation — see
// ~/.claude/conventions.md §4.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indirectEval = eval; // aliased → runs in the global (sloppy) realm, so `var` leaks to globalThis
for (const f of ['util.js', 'params.js', 'engine.js', 'hex.js', 'mapgen.js', 'agent.js', 'planner.js', 'world.js']) {
  let src = readFileSync(path.join(__dirname, 'src', f), 'utf8');
  src = src.replace(/^\s*(['"])use strict\1;?/, ''); // strip directive so declarations leak to global
  indirectEval(src);
}
const { PARAMETERS: P, World, TERRAIN, T_LAKE, T_RIVER, T_PLAINS } = globalThis;

let failed = 0;
function check(name, ok, detail) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  — ' + detail : ''));
  if (!ok) failed++;
}

// FNV-1a over the map: terrain, springs and every cap (rounded)
function mapHash(w) {
  let h = 2166136261;
  const mix = (x) => { h ^= x & 0xffff; h = Math.imul(h, 16777619) >>> 0; };
  for (const t of w.terrain) mix(t);
  for (const s of w.spring) mix(s);
  for (const k of Object.keys(w.caps).sort()) for (const c of w.caps[k]) mix(Math.round(c * 10));
  return h.toString(16);
}

// ── 1. determinism ────────────────────────────────────────────────────────────────────
P.seed = 1;
const w1 = new World({ agents: 0 }), w1b = new World({ agents: 0 });
P.seed = 2;
const w2 = new World({ agents: 0 });
P.seed = 1;
check('same seed → same map', mapHash(w1) === mapHash(w1b), mapHash(w1));
check('different seed → different map', mapHash(w1) !== mapHash(w2), mapHash(w2));

// ── 2. map shape ──────────────────────────────────────────────────────────────────────
const n = w1.grid.n;
const counts = TERRAIN.map((_, t) => w1.terrain.filter((x) => x === t).length);
console.log('terrain: ' + TERRAIN.map((t, i) => t + ' ' + (100 * counts[i] / n).toFixed(1) + '%').join(', '));
const springs = w1.spring.reduce((a, b) => a + b, 0);
check('rivers traced from springs', springs === P.map.nRivers && counts[T_RIVER] > springs, springs + ' springs, ' + counts[T_RIVER] + ' river hexes');
const depositHexes = {};
for (const k of ['flint', 'clay', 'copper', 'tin', 'iron']) depositHexes[k] = w1.active[k].length;
console.log('deposit hexes: ' + JSON.stringify(depositHexes));
check('every deposit kind placed', Object.values(depositHexes).every((v) => v > 0));
const cu = w1.centres.copper, sn = w1.centres.tin;
const tinD = Math.min(...cu.map((c) => w1.grid.dist(c, sn[0])));
check('tin sits ~distanceFromCopper from copper', Math.abs(tinD - P.resources.tin.distanceFromCopper) <= 3,
  'tin–copper ' + tinD + ' hexes (target ' + P.resources.tin.distanceFromCopper + ')');

// ── 3. fixed map round trip ───────────────────────────────────────────────────────────
const wf = new World({ map: JSON.parse(JSON.stringify(w1.exportMap())), agents: 0 });
check('exported map reloads identically', mapHash(wf) === mapHash(w1));

// ── 4. resources and seasons ──────────────────────────────────────────────────────────
const w = new World({ agents: 0 });
const Y = P.year.days;
let inBounds = true;
const t0 = Date.now();
const waterBySeason = { spring: [], summer: [], autumn: [], winter: [] };
function stepDays(k) {
  for (let d = 0; d < k; d++) {
    w.update();
    waterBySeason[w.season().name].push(w.stockFraction('water'));
    for (const r in w.caps) {
      const cap = w.caps[r], st = w.stock[r], amp = P.resources[r].kind === 'flow' ? 1 + P.year.rainAmplitude : 1;
      for (const i of w.active[r]) if (st[i] < -1e-6 || st[i] > cap[i] * amp + 1e-3) inBounds = false;
    }
  }
}
// run to the first day of autumn, then strip plants on 50 hexes and all copper
stepDays(Y / 2 - w.day);
const plantHexes = Array.from(w.active.plants).filter((i) => w.terrain[i] === T_PLAINS).slice(0, 50);
for (const i of plantHexes) w.take('plants', i, Infinity);
for (const i of w.active.copper) w.take('copper', i, Infinity);
const sum = (res, cells) => cells.reduce((a, i) => a + w.stock[res][i], 0);
const capSum = (res, cells) => cells.reduce((a, i) => a + w.caps[res][i], 0);
stepDays(Y / 2);  // autumn + winter: no growth
const afterWinter = sum('plants', plantHexes);
stepDays(Y / 2);  // spring + summer
const afterSummer = sum('plants', plantHexes) / capSum('plants', plantHexes);
stepDays(Y / 2);
stepDays(Y / 2);  // a second growing season
const afterTwo = sum('plants', plantHexes) / capSum('plants', plantHexes);
const ms = (Date.now() - t0) / w.day;
check('no regrowth in autumn/winter', afterWinter === 0, 'stripped plants after winter: ' + afterWinter.toFixed(3));
check('stripped plants regrow in spring/summer', afterSummer > 0.05 && afterTwo > afterSummer,
  'fraction of cap after 1 season ' + afterSummer.toFixed(3) + ', after 2 ' + afterTwo.toFixed(3));
check('deposits never regrow', sum('copper', Array.from(w.active.copper)) === 0);
check('every stock stays within [0, cap]', inBounds, 'over ' + w.day + ' days');
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
check('water higher in spring than autumn', mean(waterBySeason.spring) > mean(waterBySeason.autumn),
  'mean water fraction spring ' + mean(waterBySeason.spring).toFixed(2) + ', autumn ' + mean(waterBySeason.autumn).toFixed(2));

// ── 5. travel ─────────────────────────────────────────────────────────────────────────
const rng = globalThis.makeRng(7);
const land = [];
for (let i = 0; i < n; i++) if (w1.terrain[i] !== T_LAKE) land.push(i);
let symmetric = true, lowerBound = true, lakeBlocked = true;
for (let k = 0; k < 30; k++) {
  const a = rng.pick(land), b = rng.pick(land);
  const da = w1.travelFrom(a), db = w1.travelFrom(b);
  if (Math.abs(da[b] - db[a]) > 1e-4) symmetric = false;
  if (da[b] < w1.grid.dist(a, b) * P.terrainHours.plains - 1e-4) lowerBound = false;
  for (let i = 0; i < n; i++) if (w1.terrain[i] === T_LAKE && da[i] !== Infinity) lakeBlocked = false;
}
check('travel time symmetric', symmetric);
check('travel time ≥ hex steps × fastest terrain', lowerBound);
check('lakes impassable', lakeBlocked);
const mid = Math.floor(w1.grid.H / 2) * w1.grid.W + Math.floor(w1.grid.W / 2);
const home = land.filter((i) => w1.terrain[i] === T_PLAINS).sort((a, b) => w1.grid.dist(a, mid) - w1.grid.dist(b, mid))[0];
const reach = w1.travelFrom(home, 4).filter((x) => x <= 4).length;
console.log('hexes within 4 hours of a plains hex: ' + reach + ' (open plain would give 61)');

console.log('world.update: ' + ms.toFixed(3) + ' ms/day (' + n + ' hexes, includes bounds checks)');

// ── 6. agents (Stage 2) ───────────────────────────────────────────────────────────────
// A world with its plant caps scaled, then `nAgents` placed (same rng as the map).
function agentWorld(plantScale, nAgents) {
  const aw = new World({ agents: 0 });
  for (const i of aw.active.plants) { aw.caps.plants[i] *= plantScale; aw.stock.plants[i] = aw.caps.plants[i]; }
  if (plantScale === 0) aw.active.plants = new Int32Array(0);
  aw.placeAgents(nAgents);
  return aw;
}
const snapshot = (aw) => JSON.stringify(aw.agents.map((a) => [a.home, a.need, a.hold, a.shelter]).concat(aw.dead.map((a) => [a.id, a.deathDay])));
const da = agentWorld(1, 8), db = agentWorld(1, 8);
for (let d = 0; d < 120; d++) { da.update(); db.update(); }
check('same seed → same agent histories', snapshot(da) === snapshot(db));

// rich map: plants ×3; 8 agents for a year. Solitary survival is NOT a goal (humans are not
// solitary; Chris, 2026-11-02): this checks the mechanics — needs held near set points by
// those living, work rising in winter — and only reports how many lived.
const rich = agentWorld(3, 8);
const bySeason = { spring: [], summer: [], autumn: [], winter: [] };
let foodSum = 0, waterSum = 0, k = 0;
const t1 = Date.now();
for (let d = 0; d < Y; d++) {
  rich.update();
  for (const a of rich.agents) { foodSum += Math.min(1, a.need.food); waterSum += a.need.water; k++; bySeason[rich.season().name].push(a.busy); }
}
const msAgentDay = (Date.now() - t1) / (Y * 8);
console.log('rich map, solitary: ' + rich.agents.length + '/8 alive after a year (reported, not required)');
check('rich map: needs near set points among the living', foodSum / k > 0.9 && waterSum / k > 0.95,
  'mean food ' + (foodSum / k).toFixed(3) + ', water ' + (waterSum / k).toFixed(3));
check('more hours worked in winter than summer', mean(bySeason.winter) > mean(bySeason.summer),
  'mean hours: spring ' + mean(bySeason.spring).toFixed(1) + ', summer ' + mean(bySeason.summer).toFixed(1) +
  ', autumn ' + mean(bySeason.autumn).toFixed(1) + ', winter ' + mean(bySeason.winter).toFixed(1));

// barren map: no wild plants at all
const barren = agentWorld(0, 8);
for (let d = 0; d < 90 && barren.agents.length; d++) barren.update();
check('barren map: all starve', barren.agents.length === 0 && barren.dead.every((a) => a.cause === 'hunger'),
  barren.dead.length + ' died of ' + [...new Set(barren.dead.map((a) => a.cause))].join(',') + ' by day ' + Math.max(...barren.dead.map((a) => a.deathDay)));

// depletion: one agent; strip the hex it forages most, behind its back; it should find out
// once and stop going there
const solo = agentWorld(3, 1), ag = solo.agents[0];
const visits = new Map();
for (let d = 0; d < 40; d++) { solo.update(); for (const st of ag.plan) if (st.act === A_FORAGE) visits.set(st.hex, (visits.get(st.hex) || 0) + 1); }
const fav = [...visits.entries()].sort((a, b) => b[1] - a[1])[0][0];
solo.stock.plants[fav] = 0;
let after = 0;
for (let d = 0; d < 20; d++) { solo.update(); for (const st of ag.plan) if (st.act === A_FORAGE && st.hex === fav) after++; }
check('stops foraging a hex it finds stripped', after <= 1, 'favourite hex used ' + visits.get(fav) + 'x in 40 days; ' + after + 'x in the 20 days after stripping');

const proj = msAgentDay * 300 * 9000 / 1000;
console.log('planner cost: ' + msAgentDay.toFixed(3) + ' ms per agent-day → ~' + proj.toFixed(0) + ' s per generation for 300 agents × 9,000 days');
console.log('smoke: ' + (failed ? failed + ' FAILED' : 'PASS'));
process.exit(failed ? 1 : 0);
