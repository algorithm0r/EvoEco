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
for (const f of ['util.js', 'params.js', 'engine.js', 'hex.js', 'mapgen.js', 'agent.js', 'tree.js', 'planner.js', 'exchange.js', 'life.js', 'game.js', 'world.js']) {
  let src = readFileSync(path.join(__dirname, 'src', f), 'utf8');
  src = src.replace(/^\s*(['"])use strict\1;?/, ''); // strip directive so declarations leak to global
  indirectEval(src);
}
const { PARAMETERS: P, World, TERRAIN, T_LAKE, T_RIVER, T_PLAINS, T_FOREST } = globalThis;

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
  for (const k of Object.keys(w.cover).sort()) for (const c of w.cover[k]) mix(Math.round(c * 1000));
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
      const cap = w.caps[r], amp = P.resources[r].kind === 'flow' ? 1 + P.year.rainAmplitude : 1;
      for (const i of w.active[r]) { const x = w.amount(r, i); if (x < -1e-6 || x > cap[i] * amp + 1e-3) inBounds = false; }
    }
    for (const i of w.landHexes) {
      const tot = w.cover.grass[i] + w.cover.roots[i] + w.cover.trees[i] + w.fieldLand[i];
      if (tot > 1 + 1e-4 || w.cover.grass[i] < -1e-6 || w.cover.roots[i] < -1e-6 || w.cover.trees[i] < -1e-6) inBounds = false;
    }
  }
}
const sum = (res, cells) => cells.reduce((a, i) => a + w.amount(res, i), 0);
const coverOf = (c, cells) => cells.reduce((a, i) => a + w.cover[c][i], 0) / cells.length;
// spring: pick the greens bare on 50 open hexes; cut the trees on 20 wet hexes; dig out the
// roots on 20 open hexes; take all the copper
stepDays(Math.round(0.1 * Y));
const open = Array.from(w.landHexes).filter((i) => w.terrain[i] === T_PLAINS && w.edge[i] === 0);
const picked = open.slice(0, 50), dug = open.slice(50, 70);
const cleared = Array.from(w.landHexes).filter((i) => w.edge[i] > 0.3).slice(0, 20);
const grassBefore = coverOf('grass', picked), rootsBefore = coverOf('roots', dug);
for (const i of picked) w.take('greens', i, Infinity);
for (const i of cleared) w.take('wood', i, Infinity);
for (const i of dug) w.take('roots', i, Infinity);
for (const i of w.active.copper) w.take('copper', i, Infinity);
const greensPicked = sum('greens', picked);
check('picking takes the crop, not the plant', greensPicked === 0 && Math.abs(coverOf('grass', picked) - grassBefore) < 1e-9,
  'greens left on 50 picked hexes ' + greensPicked + '; their grass ' + grassBefore.toFixed(3) + ' → ' + coverOf('grass', picked).toFixed(3));
check('cutting wood takes the trees, digging roots takes the roots', coverOf('trees', cleared) === 0 && coverOf('roots', dug) === 0);
stepDays(Math.round(0.4 * Y) - w.day);   // summer
const allLand = Array.from(w.landHexes);
const summerGreens = sum('greens', allLand), summerSeeds = sum('seeds', allLand), summerNuts = sum('nuts', allLand);
stepDays(Math.round(0.6 * Y) - w.day);   // autumn
const autumnSeeds = sum('seeds', allLand), autumnNuts = sum('nuts', allLand);
check('each crop is there only in its season', summerGreens === 0 && summerSeeds > 0 && summerNuts === 0 && autumnSeeds === 0 && autumnNuts > 0,
  'summer: greens ' + summerGreens.toFixed(0) + ', seeds ' + summerSeeds.toFixed(0) + ', nuts ' + summerNuts.toFixed(0) +
  '; autumn: seeds ' + autumnSeeds.toFixed(0) + ', nuts ' + autumnNuts.toFixed(0));
const grassCleared1 = coverOf('grass', cleared), treesCleared1 = coverOf('trees', cleared);
stepDays(Math.round(1.1 * Y) - w.day);   // the next spring
const greensBack = sum('greens', picked) / picked.reduce((a, i) => a + w.caps.greens[i] * w.cover.grass[i], 0);
check('picked greens are back the next spring', greensBack > 0.99, 'share of a full crop ' + greensBack.toFixed(3));
stepDays(8 * Y - w.day);   // seven years on from the clearing
const treesOpen = Math.max(...open.map((i) => w.cover.trees[i]));
check('cleared wet land goes to grass, then back to forest', grassCleared1 > 0.5 && treesCleared1 < 0.1 && coverOf('trees', cleared) > 0.5,
  'cleared hexes: first summer grass ' + grassCleared1.toFixed(2) + ', trees ' + treesCleared1.toFixed(2) + '; trees after 7 years ' + coverOf('trees', cleared).toFixed(2));
check('dry open land stays open', treesOpen <= P.land.open.trees + 0.01, 'most trees on an open hex after 7 years ' + treesOpen.toFixed(3) + ' (start ' + P.land.open.trees + ')');
check('dug-out roots come back over years', coverOf('roots', dug) > 0.5 * rootsBefore,
  'roots on dug hexes: ' + rootsBefore.toFixed(2) + ' → 0 → ' + coverOf('roots', dug).toFixed(2) + ' after 7 years');
const ms = (Date.now() - t0) / w.day;
check('deposits never regrow', sum('copper', Array.from(w.active.copper)) === 0);
check('every stock stays within [0, cap], every hex\'s covers within its land', inBounds, 'over ' + w.day + ' days');
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
// A world with its wild food scaled, then `nAgents` placed (same rng as the map).
function agentWorld(foodScale, nAgents) {
  const aw = new World({ agents: 0 });
  for (const r of ['greens', 'seeds', 'nuts', 'roots']) {
    for (const i of aw.active[r]) { aw.caps[r][i] *= foodScale; if (aw.stock[r]) aw.stock[r][i] *= foodScale; }
    if (foodScale === 0) aw.active[r] = new Int32Array(0);
  }
  if (foodScale === 0) {   // no game either (Stage 5h): no small game, no herds
    aw.stock.smallgame.fill(0); aw.caps.smallgame.fill(0); aw.active.smallgame = new Int32Array(0);
    aw.game.herds = [];
  }
  aw.placeAgents(nAgents);
  return aw;
}
const snapshot = (aw) => JSON.stringify(aw.agents.map((a) => [a.home, a.need, a.hold, a.shelter]).concat(aw.dead.map((a) => [a.id, a.deathDay])));
const da = agentWorld(1, 8), db = agentWorld(1, 8);
for (let d = 0; d < 120; d++) { da.update(); db.update(); }
check('same seed → same agent histories', snapshot(da) === snapshot(db));

// rich map: wild food ×3; 8 agents for a year. Solitary survival is NOT a goal (humans are not
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

// barren map: no wild food at all
const barren = agentWorld(0, 8), herdMin = P.game.herd.min;
P.game.herd.min = 0;   // and none come in from beyond the map
for (let d = 0; d < 90 && barren.agents.length; d++) barren.update();
P.game.herd.min = herdMin;
check('barren map: all starve', barren.agents.length === 0 && barren.dead.every((a) => a.cause === 'hunger'),
  barren.dead.length + ' died of ' + [...new Set(barren.dead.map((a) => a.cause))].join(',') + ' by day ' + Math.max(...barren.dead.map((a) => a.deathDay)));

// depletion: one agent; strip the hex it forages most, behind its back; it should find out
// once and stop going there
const solo = agentWorld(3, 1), ag = solo.agents[0];
const visits = new Map();
for (let d = 0; d < 40; d++) { solo.update(); for (const st of ag.plan) if (st.act === A_GREENS) visits.set(st.hex, (visits.get(st.hex) || 0) + 1); }
const fav = [...visits.entries()].sort((a, b) => b[1] - a[1])[0][0];
solo.stock.greens[fav] = 0;
let after = 0;
for (let d = 0; d < 20; d++) { solo.update(); for (const st of ag.plan) if (st.act === A_GREENS && st.hex === fav) after++; }
check('stops foraging a hex it finds stripped', after <= 1, 'favourite hex used ' + visits.get(fav) + 'x in 40 days; ' + after + 'x in the 20 days after stripping');

// ── 7. meeting, chat and norms (Stage 3) ──────────────────────────────────────────────
const bw = new World();   // default layout: bands
const B = P.agents.bands;
let minSep = Infinity;
for (const a of bw.bandCentres) for (const b of bw.bandCentres) if (a !== b) minSep = Math.min(minSep, bw.grid.dist(a, b));
const inBand = bw.agents.every((a) => bw.grid.dist(a.home, bw.bandCentres[a.band]) <= B.radius);
check('bands placed apart, members near their centre', bw.bandCentres.length === B.n && minSep >= B.spacing && inBand,
  bw.bandCentres.length + ' bands of ' + B.size + ', closest pair ' + minSep + ' hexes apart');
let chatCap = true, metSum = 0, md = 0;
for (let d = 0; d < 60; d++) {
  bw.update();
  for (const a of bw.agents) { if (a.chatted > P.agents.chatK) chatCap = false; metSum += a.met.length; md++; }
}
check('chat never exceeds k a day', chatCap, 'mean met per agent-day ' + (metSum / md).toFixed(1) + ', k = ' + P.agents.chatK);
const withNorm = bw.agents.filter((a) => a.yld[A_GREENS].nn > 0);
const normErr = mean(withNorm.map((a) => Math.abs(a.yld[A_GREENS].n - P.resources.greens.perHour) / P.resources.greens.perHour));
check('forage norms converge on the true rate where agents meet', withNorm.length > 0.8 * bw.agents.length && normErr < 0.1,
  withNorm.length + '/' + bw.agents.length + ' hold a norm; mean error ' + (100 * normErr).toFixed(1) + '%');
check('no norm without a meeting', bw.agents.concat(bw.dead).every((a) => a.yld[A_GREENS].nn === 0 || a.metTotal > 0));
const heard = bw.agents.filter((a) => a.heard > 0).length;
check('sightings spread by chat', heard > 0, heard + '/' + bw.agents.length + ' know hexes only from others (mean ' + mean(bw.agents.map((a) => a.heard)).toFixed(1) + ')');
console.log('bands after 60 days: ' + bw.agents.length + '/' + (B.n * B.size) + ' alive');

// ── 8. exchange and ties (Stage 4) ────────────────────────────────────────────────────
// Controlled market, one hex in winter: n wood sellers short of food, m food sellers short
// of wood, holdings drawn at random; mean deal price over 20 draws. The food is roots.
function market(nWood, nFood, seed) {
  const mw = new World({ agents: 0 }); mw.day = 270; mw.rng = makeRng(seed);
  const home = [...Array(mw.grid.n).keys()].find((i) => mw.terrain[i] === T_PLAINS);
  const r = makeRng(seed + 99);
  for (let k = 0; k < nWood + nFood; k++) {
    const a = new Agent(k, home, mw);
    a.need.food = 0.3 + 0.4 * r(); a.busy = 6; a.drank = true; a.places = [home];
    Object.assign(a.hold, k < nWood ? { roots: 5 * r(), wood: 20 + 60 * r() } : { roots: 20 + 60 * r(), wood: 2 * r() });
    mw.agents.push(a);
  }
  exchangeDay(mw, mw.agents);
  return mw.tradesToday.filter((t) => t.key === 'roots|wood').map((t) => Math.log(t.p));
}
const sdPrice = [[2, 8], [5, 5], [8, 2]].map(([nw, nf]) => {
  let all = [];
  for (let s = 1; s <= 20; s++) all = all.concat(market(nw, nf, s));
  return Math.exp(mean(all));
});
check('price of wood falls as wood sellers outnumber buyers', sdPrice[0] > sdPrice[1] && sdPrice[1] > sdPrice[2],
  'roots per wood: 2 sellers vs 8 buyers ' + sdPrice[0].toFixed(3) + ', 5 vs 5 ' + sdPrice[1].toFixed(3) + ', 8 vs 2 ' + sdPrice[2].toFixed(3));

// bands for a year from no ties at all
const xw = new World();
let trades = 0, gifts = 0, maxOwed = 0, firstTrade = -1, firstGift = -1, toolTrades = 0;
for (let d = 1; d <= Y; d++) {
  xw.update();
  trades += xw.tradesToday.length; gifts += xw.giftsToday;
  for (const t of xw.tradesToday) if (/flint|axe|pick/.test(t.key)) toolTrades++;
  if (firstTrade < 0 && xw.tradesToday.length) firstTrade = d;
  if (firstGift < 0 && xw.giftsToday) firstGift = d;
  if (d % 30 === 0) for (const a of xw.agents) for (const id of a.ties.keys()) maxOwed = Math.max(maxOwed, a.owedBy(id, xw.day));
}
let trusted = 0;
for (const a of xw.agents) for (const id of a.ties.keys()) if (a.trust(id, xw.day) > 2) trusted++;
check('ties form through barter from a no-tie start', trades > 0 && gifts > 0 && trusted > 0 && firstTrade <= firstGift,
  trades + ' trades (first day ' + firstTrade + '), ' + gifts + ' gifts (first day ' + firstGift + '), ' + trusted + ' trusted ties after a year');
const tieA = new Agent(0, 0, xw), tieRec = tieA.tie(1, 0);
tieRec.owed = 3;
const owedLater = tieA.owedBy(1, 100);
check('grudges appear and fade', maxOwed >= P.exchange.owedLimit && owedLater < 3 && owedLater > 0,
  'largest unreturned balance seen ' + maxOwed.toFixed(2) + ' (limit ' + P.exchange.owedLimit + '); a balance of 3 is ' + owedLater.toFixed(2) + ' after 100 days');
console.log('bands after a year with exchange: ' + xw.agents.length + '/' + (B.n * B.size) + ' alive, mean belonging ' + mean(xw.agents.map((a) => a.need.belonging)).toFixed(2));
// Stage 5g: no winter floor; winter food is roots and stores
const causes = {};
for (const a of xw.dead) causes[a.cause] = (causes[a.cause] || 0) + 1;
check('bands come through their first winter without the winter floor', xw.agents.length >= 0.6 * B.n * B.size,
  xw.agents.length + '/' + (B.n * B.size) + ' alive after a year; deaths ' + JSON.stringify(causes));

// ── 9. stone tools (Stage 5a) ─────────────────────────────────────────────────────────
// one agent cuts wood for 2 hours on the same hex, with and without an axe
const tw = new World({ agents: 0 });
const woodHex = tw.active.wood.find((i) => tw.terrain[i] === T_FOREST);
// (carrying limits lifted here: this tests the tool, ODD §2 Containers and carrying)
const unlimited = (f) => { const C = P.carry, b = C.bare, l = C.load; C.bare = { loose: 1e9, bulky: 1e9, water: 0 }; C.load = 1e9; try { return f(); } finally { C.bare = b; C.load = l; } };
const cut = (withAxe) => unlimited(() => {
  tw.cover.trees[woodHex] = 1;
  const a = new Agent(0, woodHex, tw);
  a.hold.axe = withAxe ? 1 : 0;
  a.plan = [{ hex: woodHex, act: A_WOOD, hours: 2 }];
  a.act(tw);
  return a;
});
const bare = cut(false), axed = cut(true);
// in bare hands an armful of wood is all it carries home; the rest stays standing
const handWood = (() => { tw.cover.trees[woodHex] = 1; const a = new Agent(0, woodHex, tw); a.hold.axe = 1; a.plan = [{ hex: woodHex, act: A_WOOD, hours: 2 }]; a.act(tw); return a.hold.wood; })();
check('what it carries home is limited by what its hands hold', Math.abs(handWood - P.carry.bare.bulky / P.carry.weight.wood) < 1e-6 && axed.hold.wood > handWood,
  'wood in 2 h with an axe: ' + handWood.toFixed(2) + ' carried (an armful) of ' + axed.hold.wood.toFixed(2) + ' cut with no limit');
check('an axe multiplies wood cut by its multiplier', Math.abs(axed.hold.wood / bare.hold.wood - TOOLS.axe.mult) < 0.01,
  'wood in 2 h: bare hands ' + bare.hold.wood.toFixed(2) + ', axe ' + axed.hold.wood.toFixed(2));
const wearAgent = cut(true);
for (let k = 0; k < TOOLS.axe.life / 2; k++) { wearAgent.plan = [{ hex: woodHex, act: A_WOOD, hours: 2 }]; wearAgent.act(tw); }
check('an axe wears out after its life in hours', wearAgent.hold.axe === 0, 'axe left after ' + (TOOLS.axe.life + 2) + ' h of use: ' + wearAgent.hold.axe);
check('stone tools are made and flint or tools change hands', (xw.crafted || 0) > 0 && toolTrades > 0,
  (xw.crafted || 0) + ' tools made in the bands year, ' + toolTrades + ' trades in flint or tools');

// ── 10. crafted levels, tinkering, know-how (Stage 5b) ───────────────────────────────
// tinkering finds a level only with its inputs at hand: at a clay bank with wood in hand vs
// on bare ground with nothing (discovery chance raised for the test, then restored)
const kw = new World({ agents: 0 });
const clayHex = kw.active.clay[0];
const bareHex = [...Array(kw.grid.n).keys()].find((i) => kw.hours[i] >= 0 && kw.grid.within(i, 0).every((m) =>
  ['greens', 'seeds', 'nuts', 'roots', 'wood', 'clay', 'flint'].every((r) => !(kw.caps[r][m] > 0))));
const dp = P.agents.discoverPerHour;
P.agents.discoverPerHour = 0.1;
const tinkerer = (hex, wood) => {
  const a = new Agent(0, hex, kw);
  a.hold.roots = 0; a.hold.wood = wood;
  for (let k = 0; k < 50 && !a.knows.has('pot'); k++) a.tinkerAt(kw, hex, 2);
  return a;
};
const withInputs = tinkerer(clayHex, 5), without = tinkerer(bareHex, 0);
P.agents.discoverPerHour = dp;
check('tinkering finds a level only with its inputs at hand', withInputs.knows.has('pot') && !without.knows.has('pot'),
  'clay bank with wood: ' + (withInputs.knows.has('pot') ? 'found the pot' : 'nothing') + '; bare ground, empty-handed: ' + (without.knows.has('pot') ? 'found it' : 'nothing in 100 h'));
check('agents discover level 2 by tinkering in the bands year', xw.discoveries.length > 0,
  xw.discoveries.length + ' discoveries (' + [...new Set(xw.discoveries.map((d) => d.what))].join(', ') + '), first on day ' +
  (xw.discoveries[0] ? xw.discoveries[0].day : '-') + '; ' + Math.round(xw.tinkerHours || 0) + ' hours tinkering; ' + xw.learnedBySeeing.length + ' learned by seeing');

// a pot stores water where it stays, at camp (ODD §2 carrying: it is not carried)
const wetHex = kw.waterAt.findIndex((x) => x >= 0);
const potA = new Agent(0, wetHex, kw);
const potB = new Agent(1, wetHex, kw);
potB.hold.pot = 1;
for (const a of [potA, potB]) { a.plan = [{ hex: wetHex, act: A_DRINK, hours: 0.25 }]; a.act(kw); }
check('a pot stores more water at camp', potB.hold.water > potA.hold.water,
  'water kept: gourd ' + potA.hold.water.toFixed(2) + ', gourd and pot ' + potB.hold.water.toFixed(2));

// a hut is a multi-day build: 4 hours a day with the inputs and an axe; no warmth until done
const hutA = new Agent(0, clayHex, kw);
hutA.knows.add('hut');
Object.assign(hutA.hold, { wood: 40, clay: 10, axe: 1 });
let hutDays = 0, insBefore = 0;
while (!hutA.shelter.hutDone && hutDays < 30) {
  if (hutDays === 2) insBefore = shelterIns(hutA.shelter);
  hutA.plan = [{ hex: hutA.home, act: A_BUILD, build: 'hut', hours: 4 }];
  hutA.act(kw);
  hutDays++;
}
check('a hut takes several days and warms only once finished', hutA.shelter.hutDone && hutDays > 1 && insBefore === 0 && shelterIns(hutA.shelter) > 0,
  'finished in ' + hutDays + ' days of 4 h (axe ×' + TOOLS.axe.mult + '); insulation part-built ' + insBefore + ', finished ' + shelterIns(hutA.shelter).toFixed(2));

// bands with the hut and pot known from the start (as if discovered), to autumn: do huts get
// started and finished across days?
const hw = new World();
for (const a of hw.agents) { a.knows.add('hut'); a.knows.add('pot'); }
for (let d = 1; d <= 240; d++) hw.update();
check('multi-day builds get started and finished (bands, hut known)', (hw.hutsFinished || 0) > 0,
  (hw.hutsStarted || 0) + ' huts started, ' + (hw.hutsFinished || 0) + ' finished by day 240; ' + (hw.made.pot || 0) + ' pots made; ' +
  hw.agents.length + '/' + (B.n * B.size) + ' alive');

// know-how is kept by those who know it and learned only by seeing it practised: A knows the
// pot and B shares A's home. If A makes pots, B sees and learns; if A has no clay and never
// practises, B never learns, and when A dies the pot is lost (ODD §7.3)
const lapse = (practise) => {
  const lw = new World({ agents: 0 });
  const A = new Agent(0, clayHex, lw), Bg = new Agent(1, clayHex, lw);
  A.knows.add('pot');
  lw.agents = [A, Bg];
  for (let d = 0; d < 20; d++) {
    if (practise) Object.assign(A.hold, { clay: 2, wood: 3 });
    A.plan = [{ hex: A.home, act: A_CRAFT, recipe: 'pot', hours: 3 }];
    Bg.plan = [];
    A.act(lw); Bg.act(lw);
    lw.meet(lw.agents);
  }
  lw.agents = [Bg];   // A dies
  return lw.agents.some((a) => a.knows.has('pot'));
};
const keptIfPractised = lapse(true), keptIfLapsed = lapse(false);
check('know-how survives where practised and is lost when the craft lapses', keptIfPractised && !keptIfLapsed,
  'after the only potter dies: practised → ' + (keptIfPractised ? 'kept by the one who watched' : 'lost') + '; never practised → ' + (keptIfLapsed ? 'kept' : 'lost'));

// ── 11. farming (Stage 5d) ────────────────────────────────────────────────────────────
// A plants in spring; the field ripens on its day; B (not the planter) reaps from it, as
// anyone may (ODD §2); B gives part back; at the close A learns a return that counts the gift
const fw = new World({ agents: 0 });
const fh = [...Array(fw.grid.n).keys()].find((i) => fw.canFarm(i) && fw.fertility(i) > 0.4);
const planter = new Agent(0, fh, fw), friend = new Agent(1, fh, fw);
planter.knows.add('farm');
while (fw.day < 10) fw.update();
planter.hold.grain = 10;
const openBefore = fw.cover.grass[fh] + fw.cover.roots[fh];
planter.plan = [{ hex: fh, act: A_SOW, hours: 2 }];
planter.act(fw);
const field = fw.fields[0];
const landTaken = fw.fieldLand[fh], openAfter = fw.cover.grass[fh] + fw.cover.roots[fh];
while (fw.day < P.goods.grain.ripeDay) fw.update();
const ripeAt = field.ripe ? fw.day : -1, yielded = field.grain;
friend.plan = [{ hex: fh, act: A_REAP, hours: 2 }]; friend.act(fw);
planter.plan = [{ hex: fh, act: A_REAP, hours: 2 }]; planter.act(fw);
const gift = Math.min(10, friend.hold.grain);
friend.hold.grain -= gift; planter.hold.grain += gift;
fw.creditReturn(friend, planter, gift);
const ownReaped = field.reaped.get(planter.id) || 0, seeds = field.seeds, fert = field.fert;
while (fw.day < P.goods.grain.closeDay) fw.update();
const expected = P.goods.grain.prior + P.agents.learnRate * ((ownReaped + gift) / (seeds * fert) - P.goods.grain.prior);
check('a field takes its land from grass and roots and gives it back when it closes',
  Math.abs(landTaken - seeds * P.land.landPerSeed) < 1e-9 && Math.abs(openBefore - openAfter - landTaken) < 1e-6 && fw.fieldLand[fh] < 1e-6,
  seeds.toFixed(0) + ' seeds took ' + landTaken.toFixed(4) + ' of the land (grass and roots ' + openBefore.toFixed(4) + ' → ' + openAfter.toFixed(4) + '); after the close ' + fw.fieldLand[fh].toFixed(6));
const forestHex = [...Array(fw.grid.n).keys()].find((i) => fw.caps.soil[i] > 0 && fw.cover.trees[i] > 0.85);
check('no field where trees stand', !fw.canFarm(forestHex) || fw.sowRoom(forestHex) < 0.15,
  'room to sow under forest ' + fw.sowRoom(forestHex).toFixed(3));
check('a field sown in spring ripens on its day and anyone may reap it', ripeAt === P.goods.grain.ripeDay && friend.hold.grain + gift > 0 && Math.abs(yielded - seeds * P.goods.grain.yieldPerSeed * fert) < 1e-6,
  seeds.toFixed(0) + ' seeds at fertility ' + fert.toFixed(2) + ' → ' + yielded.toFixed(1) + ' grain on day ' + ripeAt + '; the friend reaped ' + (friend.hold.grain + gift).toFixed(1) + ', the planter ' + ownReaped.toFixed(1));
check("grain given back by the reaper counts in the planter's learned return", field.returned === gift && Math.abs(planter.farmL.h - expected) < 1e-9 && fw.fields.length === 0,
  'returned ' + field.returned.toFixed(1) + '; learned return per seed ' + planter.farmL.h.toFixed(2) + ' (own reaping alone would give ' +
  (P.goods.grain.prior + P.agents.learnRate * (ownReaped / (seeds * fert) - P.goods.grain.prior)).toFixed(2) + ')');
const farmFound = xw.discoveries.filter((d) => d.what === 'farm');
check('farming is discovered by tinkering in the bands year (wild grain in hand)', farmFound.length > 0,
  farmFound.length + ' discoveries of farming, first on day ' + (farmFound[0] ? farmFound[0].day : '-'));

// ── 12. food kinds and processing (Stage 5g) ─────────────────────────────────────────
// eating goes fastest-rotting first; drying makes greens keep; the bands year processes food
const ew = new World({ agents: 0 }), ea = new Agent(0, fh, ew);
const ev = Agent.evening({ food: 0.9, water: 1 }, Object.assign({}, ea.hold, { greens: 3, roots: 3, grain: 3, wood: 0, water: 0 }), 0, 0, true, 0, 14);
check('the fastest-rotting food is eaten first', ev.hold.greens === 0 && ev.hold.roots < 3 && ev.hold.grain > 2.5,
  'left after an evening: greens ' + ev.hold.greens.toFixed(2) + ', roots ' + ev.hold.roots.toFixed(2) + ', grain ' + ev.hold.grain.toFixed(2));
ea.knows.add('drying');
Object.assign(ea.hold, { greens: 12, roots: 0 });
ea.plan = [{ hex: ea.home, act: A_PROCESS, process: 'drying', hours: 1 }];
ea.act(ew);
check('drying turns greens into food that keeps', ea.hold.greens === 0 && Math.abs(ea.hold.driedGreens - 12 * PROCESSES.drying.ratio) < 1e-9 && P.goods.driedGreens.rot < P.goods.greens.rot / 10,
  '12 greens → ' + ea.hold.driedGreens.toFixed(1) + ' dried greens (rot ' + P.goods.greens.rot + ' → ' + P.goods.driedGreens.rot + ' a day)');
const processed = Object.keys(PROCESSES).reduce((s, p) => s + (xw.made[p] || 0), 0);
const procFound = xw.discoveries.filter((d) => PROCESSES[d.what]).length;
check('food processing is discovered in the bands year', procFound > 0,
  procFound + ' discoveries of processing; batches made ' + JSON.stringify(Object.fromEntries(Object.keys(PROCESSES).map((p) => [p, xw.made[p] || 0]))) + ' (practice comes with stores to keep; reported, not required)');

// ── 13. the life cycle (Stage 6) ─────────────────────────────────────────────────────
// a birth, an infant on milk, care from the carer's hours, a child along and helping, a
// parent feeding its child, a child passed on when its carer dies, growing up, conception
{
  const lw = new World({ agents: 0 }), Y = P.year.days, L = P.life, day = () => lw.day;
  const m = new Agent(0, fh, lw), f = new Agent(1, fh, lw);
  lw.agents.push(m, f); lw.nextId = 2;
  m.female = true; f.female = false; m.ageDays = 25 * Y; f.ageDays = 30 * Y;
  for (const [a, b] of [[m, f], [f, m]]) { const t = a.tie(b.id, 0); t.kind = 3; t.given = 3; t.n = 6; t.food = 1; }
  const cap0 = m.capacity();
  m.pregnant = { father: f, due: 0, today: 0 };
  lifeDay(lw, []);
  const c = lw.agents[2];
  check('a birth: the newborn is its mother\'s charge, its father known', !!c && c.child && c.carer === m && c.mother === m && c.father === f && m.charges[0] === c && f.kids[0] === c,
    'id ' + (c && c.id) + ', age ' + (c && c.ageDays) + ' days');
  check('an infant takes hours from its carer and food as milk', Math.abs(cap0 - m.capacity() - L.careHours[0]) < 1e-9 && Math.abs(foodScale(m) - 1 - L.milkFood) < 1e-9,
    'capacity ' + cap0 + ' → ' + m.capacity() + '; mother\'s food need ×' + foodScale(m));
  m.need.food = 0.6;
  dependentEvening(c, lw);
  check('a nursing infant\'s food is its mother\'s', c.need.food === 0.6);
  // a child of 8 goes along and helps at its carer's task
  c.ageDays = 8 * Y;
  const hx = [...Array(lw.grid.n).keys()].find((i) => lw.land[i] > 0 && lw.inSeason('greens') && lw.amount('greens', i) > 10);
  m.plan = [{ hex: hx, act: A_GREENS, hours: 2 }];
  unlimited(() => m.act(lw)); const withChild = m.hold.greens;
  followCarer(c, lw);
  check('a child goes with its carer and its help adds to the carer\'s haul', c.places.join() === m.places.join() && withChild > 0 &&
    m.tie(c.id, day()).kind > 0 && c.tie(m.id, day()).kind > 0,
    'mother picked ' + withChild.toFixed(1) + ' greens with a child of 8 (rate ×' + workRate(c).toFixed(2) + '); mother\'s tally of the child ' + m.tie(c.id, day()).kind.toFixed(1));
  // a parent feeds its hungry child, out of the owing balance
  Object.assign(m.hold, { greens: 0, roots: 10 }); c.need.food = 0.1; for (const k of FOODS) c.hold[k] = 0;
  m.need.food = 1; c.busy = 0; m.busy = 2;
  const owedBefore = m.tie(c.id, day()).owed;
  giftsAt(lw, [m, c]);
  check('a parent feeds its hungry child, without a debt', c.hold.roots > 0 && m.tie(c.id, day()).owed === owedBefore,
    'gave ' + c.hold.roots.toFixed(2) + ' roots; weight on the child ' + weightOn(m, c, day()).toFixed(3) + ' (expected ' + expectedChildWeight(m, day()).toFixed(3) + ')');
  // the mother dies: the child (8) passes to its father, who values it as a parent
  m.alive = false; lw.agents = lw.agents.filter((a) => a.alive);
  lifeDay(lw, [m]);
  check('a child whose carer dies passes to a willing adult', c.carer === f && f.charges.includes(c) && c.keeper === f, 'carer now ' + (c.carer ? c.carer.id : 'none'));
  // grown at matureAge: on its own
  c.ageDays = L.matureAge * Y;
  lifeDay(lw, []);
  check('at matureAge a child plans on its own', !c.child && !c.carer && !f.charges.includes(c) && c.shelter && f.childSeen.grown === 1);
  // conception: both returns weighed; with a certain month, she conceives exactly when both are positive
  const w2 = new Agent(3, fh, lw), m2 = new Agent(4, fh, lw);
  lw.agents.push(w2, m2); w2.female = true; m2.female = false; w2.ageDays = 22 * Y; m2.ageDays = 24 * Y;
  for (const [a, b] of [[w2, m2], [m2, w2]]) { const t = a.tie(b.id, day()); t.kind = 3; t.given = 3; t.n = 6; t.food = 2; }
  const rw = childReturn(w2, lw, m2), rm = childReturn(m2, lw, w2);
  const conceive0 = L.conceive; L.conceive = 1;
  while (lw.day % L.month) lw.day++;
  // a starting woman's wait before her first conception (ODD §5, Decided 2026-11-07)
  w2.fertileFrom = lw.day + 1;
  conceptionDay(lw);
  const waited = !w2.pregnant;
  w2.fertileFrom = 0;
  conceptionDay(lw);
  L.conceive = conceive0;
  const sw = new World(), Ws = sw.agents.filter((a) => a.female), waits = Ws.map((a) => a.fertileFrom / Y);
  check('starting women wait a spread of times before they can first conceive; men and the born do not', waited &&
    sw.agents.every((a) => a.female || a.fertileFrom === 0) && Math.max(...waits) <= L.startWait && Math.max(...waits) - Math.min(...waits) > L.startWait / 2,
    Ws.length + ' women, waits ' + Math.min(...waits).toFixed(2) + '–' + Math.max(...waits).toFixed(2) + ' years (mean ' + (waits.reduce((x, y) => x + y, 0) / Ws.length).toFixed(2) + ')');
  check('a woman tries for a child only when both returns are positive', !!w2.pregnant === (rw > 0 && rm > 0) && (!w2.pregnant || w2.pregnant.father === m2),
    'her return ' + rw.toFixed(0) + ' h, his ' + rm.toFixed(0) + ' h → ' + (w2.pregnant ? 'conceived' : 'no'));
  // she counts the children she already has (ODD §7.4, Decided 2026-11-13): the same woman, with
  // three in her care, judges another child worth less, by the rest it takes from a fuller day
  w2.pregnant = null;
  const fhW = hoursPerFood(w2, lw), workW = w2.busyHabit.reduce((s, H) => s + H.v / 4, 0);
  const c0 = crowding(w2, fhW, workW), had = w2.charges;
  w2.charges = [1, 4, 8].map((y) => ({ alive: true, child: true, ageDays: y * Y }));
  const c3 = crowding(w2, fhW, workW), rw3 = childReturn(w2, lw, m2);
  w2.charges = had;
  check('a woman counts the children she already has: another child costs more rest with three in her care', c3 > c0 && rw3 < rw,
    'rest cost of another child ' + c0.toFixed(0) + ' h with none, ' + c3.toFixed(0) + ' h with three; her return ' + rw.toFixed(0) + ' → ' + rw3.toFixed(0) + ' h');
}
// planning together (ODD §7.6): a tie's announced haul counts as coming in, by the learned
// share of its hauls that came back; what comes back moves that share
{
  const pw = new World({ agents: 0 }), a = new Agent(0, fh, pw), b = new Agent(1, fh, pw);
  pw.agents.push(a, b);
  const t = a.tie(b.id, 0); t.kind = 2; t.given = 2; t.n = 4; t.rel = newLearned(0.5); t.rel.nh = 1;
  b.announced = { greens: 10 };
  const inc = expectedIncoming(a, pw);
  a.recv = new Map([[b.id, 10]]);
  learnReliability(pw);
  check("a tie's announced haul counts as coming in, by the share that came back", inc && Math.abs(inc.greens - 5) < 1e-9 && t.rel.h > 0.5,
    'counted ' + (inc ? inc.greens : 0) + ' of 10 greens; all 10 came back, so the share moved 0.5 → ' + t.rel.h.toFixed(3));
}
// ── 14. game, hunting and injury (Stage 5h) ─────────────────────────────────────────
// small game, herds and packs hold up with no people; a hunter on a herd can kill; the party
// raises each hunter's chance; snares catch while the owner is away; an injury can kill
{
  const gw = new World({ agents: 0 }), K = gw.caps.smallgame;
  const yearEnds = [];
  for (let d = 0; d < 10 * Y; d++) {
    gw.update();
    if (gw.day % Y === 0) { let s = 0; for (const i of gw.active.smallgame) s += gw.stock.smallgame[i] / K[i]; yearEnds.push(s / gw.active.smallgame.length); }
  }
  const animals = gw.game.herds.reduce((s, h) => s + h.n, 0), wolves = gw.game.packs.reduce((s, p) => s + p.n, 0);
  check('game holds up with no people: small game wobbles, herds and packs persist', yearEnds.every((x) => x > 0.1 && x < 0.9) && animals > 200 && wolves > 2,
    'small game at year end ' + yearEnds.map((x) => x.toFixed(2)).join(' ') + '; after 10 years ' + animals.toFixed(0) + ' animals in ' + gw.game.herds.length + ' herds, ' + wolves.toFixed(0) + ' wolves');
  const hw = new World({ agents: 0 }), ha = new Agent(0, fh, hw);
  hw.agents.push(ha);
  const herd = { hex: fh, n: 50, fed: 1 };
  hw.game.herds = [herd];
  const pk = P.hunt.pKill, fH = P.hunt.findH;
  P.hunt.pKill = 1; P.hunt.findH = 0;
  hw.huntsToday = [];
  ha.plan = [{ hex: fh, act: A_HUNT, hours: 4, unknown: 0, sign: 1 }];
  ha.act(hw); hw.settleHunts();
  P.hunt.pKill = pk; P.hunt.findH = fH;
  const lying = hw.caches && hw.caches.get(ha.at >= 0 ? ha.at : fh) || { meat: 0 };
  check('a hunter on a herd can kill; the killer keeps what it can carry, the rest lies at the kill', herd.n === 49 &&
    ha.hold.meat > 0 && ha.hold.meat < P.hunt.carcass && lying.meat > 0,
    'herd 50 → ' + herd.n + '; carried ' + ha.hold.meat.toFixed(1) + ' of ' + P.hunt.carcass + ' meat, ' + lying.meat.toFixed(1) + ' left lying');
  check("each hunter's chance rises with the party, saturating", partyFactor(1) === 1 && partyFactor(3) > 1.5 && partyFactor(8) < 1 + P.hunt.party + 1e-9,
    'chance ×' + [1, 2, 3, 5, 8].map((k) => partyFactor(k).toFixed(2)).join(', ×') + ' for 1, 2, 3, 5, 8 hunters');
  const sh = gw.active.smallgame[0], before = gw.stock.smallgame[sh];
  const sa = new Agent(1, sh, gw);
  gw.tendSnares(sa, sh, 2);
  for (let d = 0; d < 5; d++) gw.snaresDay();
  const caught = gw.tendSnares(sa, sh, 1);
  check('snares catch while the owner is elsewhere', caught > 0 && gw.stock.smallgame[sh] < before,
    caught.toFixed(2) + ' meat after 5 days away; small game there ' + before.toFixed(0) + ' → ' + gw.stock.smallgame[sh].toFixed(0));
  const I = P.injury, shares = I.shares, camp = I.camp;
  I.shares = { minor: 0, major: 0, death: 1 }; I.camp = 50;
  const ia = new Agent(2, fh, gw);
  ia.expo = { camp: 1, out: 0, hunt: 0, build: 0 };
  gw.injuries([ia]); ia.age(gw);
  I.shares = shares; I.camp = camp;
  check('an injury can kill', !ia.alive && ia.cause === 'injury', 'cause ' + ia.cause);
  // stranded and hurt, a few hours out: it edges home a little each day (Decided 2026-11-12)
  const sw = new Agent(3, fh, gw), far = gw.grid.within(fh, 3).find((m) => gw.travel(m)[fh] > 1.5 && gw.travel(m)[fh] < 4);
  sw.at = far; sw.hurt = 10; sw.walked = workingHours(sw) * I.minorCut - 0.5;   // half an hour a day
  const trip = gw.travel(far)[fh];
  let days = 0;
  for (; days < 30 && sw.at >= 0; days++) { sw.plan = []; sw.plan.out = true; sw.act(gw); }
  check('a stranded agent walks home a little at a time', sw.at === -1 && days >= Math.ceil(trip / 0.5) - 1,
    trip.toFixed(1) + ' hours from camp at half an hour a day: home after ' + days + ' days');
  // an injury costs more to one it would strand: the same agent, free, then late in pregnancy and
  // with little working capacity, so a minor injury would leave it no hours (Decided 2026-11-12)
  const pa = new Agent(4, fh, gw);
  const free = injuryCost(pa, gw, fh);
  pa.disabled = 0.5; pa.pregnant = { due: 10, today: 10 }; pa._injK = null;
  const loaded = injuryCost(pa, gw, fh);
  // moving camp: it carries what it can; the rest lies at the old camp, open to anyone, and rots
  // (ODD §2 Containers and carrying, Decided 2026-11-12)
  const mv = new Agent(5, fh, gw), other = gw.grid.within(fh, 2).find((m) => m !== fh && gw.hours[m] >= 0);
  mv.hold.roots = 200; mv.hold.nuts = 20; mv.hold.spear = 1;
  gw.moveTo(mv, { hex: other, members: [] }, 2);
  const lyingRoots = gw.caches && gw.caches.get(fh) ? gw.caches.get(fh).roots : 0;
  const kg = carriedOf(mv.hold).kg;
  gw.cachesDay();
  const later = gw.caches && gw.caches.get(fh) ? gw.caches.get(fh).roots : 0;
  check('moving camp, it carries what it can; the rest lies at the old camp and rots', kg <= P.carry.load + 1e-9 && mv.hold.spear === 1 &&
    lyingRoots > 0 && Math.abs(mv.hold.roots + lyingRoots - 200) < 1e-6 && later < lyingRoots,
    'carried ' + kg.toFixed(1) + ' kg (' + mv.hold.roots.toFixed(1) + ' roots, ' + mv.hold.nuts.toFixed(1) + ' nuts, the spear); ' + lyingRoots.toFixed(1) + ' roots left lying, ' + later.toFixed(2) + ' a day later');
  // and goes back for the rest: moving camp in more than one trip (Decided 2026-11-13)
  const fopts = planCandidates(mv, gw).filter((c) => c.act === A_FETCH && c.hex === fh);
  const fr0 = mv.hold.roots, fl0 = gw.caches.get(fh).roots;
  mv.walked = 0; mv.plan = fopts.slice(0, 1); mv.act(gw);
  const fl1 = gw.caches.get(fh) ? gw.caches.get(fh).roots : 0;
  check('it can plan a trip back and take up what was left', fopts.length === 1 && mv.hold.roots > fr0 + 1 && fl1 < fl0 && mv.at === -1,
    'a fetch stop at the old camp; roots ' + fr0.toFixed(1) + ' → ' + mv.hold.roots.toFixed(1) + ' at the new camp, ' + fl0.toFixed(1) + ' → ' + fl1.toFixed(1) + ' lying');
  // gear is a strategy whose efficiency is learned (Decided 2026-11-13): told that days with a bag
  // return twice the bare-handed food an hour, a bag is worth the hours it saves; its own day with
  // a basket teaches its return with a basket
  const ka = new Agent(7, fh, gw);
  const bagCost = (n) => { ka.hold.bag = n; ka.costs = null; return planCost(ka, gw, [], false); };
  const guess = bagCost(0) - bagCost(1);
  for (const F of ka.flow) { learnNorm(F.rbare, 2, 1); learnNorm(F.rbag, 4, 1); }
  ka._inflow = null;
  const told = bagCost(0) - bagCost(1);
  ka.hold.bag = 0;
  ka.dayRet = { food: 6, hours: 2, gear: 'basket' }; ka.si = gw.seasonIndex; ka.learn();
  const rb = ka.flow[gw.seasonIndex].rbasket;
  check('gear is worth the hours its learned return saves; a day with it teaches that return', told > guess + 1e-6 && told > 0 && rb.nh === 1 && rb.h > 0,
    'a bag: ' + guess.toFixed(3) + ' as its own guess, ' + told.toFixed(3) + ' once told bags double the return (' + (ka.flow[0].fhours.v * 0.5).toFixed(1) + ' h a day saved); return with a basket learned ' + rb.h.toFixed(2));
  // the first material tree (Decided 2026-11-12): gear raises its kind's cap; water needs a vessel;
  // gourd fruit dries where it is kept
  const ga = new Agent(6, fh, gw), c0 = newCarried();
  ga.hold.gourd = 0;
  const noVessel = carryRoom(ga, ga.hold, c0, 'water'), bareNuts = carryRoom(ga, ga.hold, c0, 'nuts');
  ga.hold.basket = 1; ga.hold.gourd = 2;
  const basketNuts = carryRoom(ga, ga.hold, c0, 'nuts');
  check('gear raises what it carries: a basket loose food, a second gourd twice the water', noVessel === 0 && basketNuts > 10 * bareNuts && vesselCap(ga.hold) === 2 * P.goods.gourd.cap,
    'nuts: ' + bareNuts.toFixed(1) + ' in bare hands, ' + basketNuts.toFixed(1) + ' with a basket; water: ' + noVessel + ' without a vessel, ' + vesselCap(ga.hold) + ' with two gourds');
  ga.hold.gourdFruit = 3;
  for (let d = 0; d < 60; d++) ga.consume(gw);
  check('gourd fruit dries where it is kept', ga.hold.driedGourd > 2 && ga.hold.gourdFruit < 1,
    'after 60 days: ' + ga.hold.gourdFruit.toFixed(2) + ' fruit, ' + ga.hold.driedGourd.toFixed(2) + ' dried; the gourds wore to ' + ga.hold.gourd.toFixed(2));
  check('an injury that would strand is priced as death', loaded > 10 * free,
    'expected cost of an injury at camp ' + free.toFixed(1) + ' free, ' + loaded.toFixed(1) + ' with no hours left if hurt');
}
console.log('bands year, hunting: ' + (xw.kills || []).length + ' big-game kills, ' + (xw.nightsOut || 0) + ' nights out, injuries ' + JSON.stringify(xw.injured || {}) + ' (reported, not required)');

console.log('bands year: ' + (xw.weighed || 0) + ' monthly weighings, ' + (xw.tries || 0) + ' tries, ' + (xw.conceptions || 0) + ' conceptions, ' + (xw.births || 0) + ' births; camps: ' + (xw.campMoves || 0) + ' moves, ' + (xw.campJoins || 0) + ' members joined another camp (reported, not required)');

const proj = msAgentDay * 300 * 9000 / 1000;
console.log('planner cost: ' + msAgentDay.toFixed(3) + ' ms per agent-day → ~' + proj.toFixed(0) + ' s per generation for 300 agents × 9,000 days');
console.log('smoke: ' + (failed ? failed + ' FAILED' : 'PASS'));
process.exit(failed ? 1 : 0);
