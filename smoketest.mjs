// No-DB sanity run. Checks the Stage 1 world (map, resources, seasons, travel) and prints
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
for (const f of ['util.js', 'params.js', 'engine.js', 'hex.js', 'mapgen.js', 'world.js']) {
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
const w1 = new World(), w1b = new World();
P.seed = 2;
const w2 = new World();
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
const wf = new World({ map: JSON.parse(JSON.stringify(w1.exportMap())) });
check('exported map reloads identically', mapHash(wf) === mapHash(w1));

// ── 4. resources and seasons ──────────────────────────────────────────────────────────
const w = new World();
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
console.log('smoke: ' + (failed ? failed + ' FAILED' : 'PASS'));
process.exit(failed ? 1 : 0);
