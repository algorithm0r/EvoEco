// Winter check with carrying (Stage 5h), and since 2026-11-13 the mothers' weighing of a child.
//   node probes/carryprobe.mjs --exp expNNN --years 10 --seed 1 [--arm limit|free]
// One row a season: days of food held per adult (at camp and with it), camp moves and members
// who joined another camp, goods lying in the world, gear held and known, deaths by cause,
// fetch trips, the learned gathering return with each gear (median, agents), and each woman's
// monthly weighing of a child by the children in her care (0, 1, 2, 3+): [weighings, found a
// child worth it, would have without the crowding cost, mean crowding cost in hours] (ODD §7.4
// She counts the children she already has). "free" lifts every carrying limit (stores weigh
// nothing).
// Since 2026-11-14 (exp002) also births each season and the age profile (5-year bins, last 60+);
// --save keeps the colony every 10 years (--every N to change) as results/expNNN_<slug>/<run>_y<year>.colony.bin.
import { loadSim, openExperiment, flag, has, colonyPath, beat } from '../exp.mjs';
const P = loadSim();
const years = +flag('years', 10), seed = +flag('seed', 1), arm = flag('arm', 'limit'), saveEvery = +flag('every', 10);
P.seed = seed;
if (arm === 'free') { P.carry.load = 1e9; P.carry.bare = { loose: 1e9, bulky: 1e9, water: 1e9 }; }
const { db, ex, dir } = await openExperiment('probes/carryprobe.mjs');
const { saveColony } = has('save') ? await import('../colony.mjs') : {};
const run = ex.run(P, { name: arm + '_s' + seed, seed, years, arm });
await run.start();
const w = new World(), Y = P.year.days, Q = Y / 4, G = P.goods, fd = P.needs.foodDecay;

// the weighing tally: wraps the life cycle's own functions, changing nothing they return
let WG = {}, cur = null, lastCrowd = 0;
const cw0 = globalThis.crowding, cr0 = globalThis.childReturn, cd0 = globalThis.conceptionDay;
const flushW = () => {
  if (!cur) return;
  const k = Math.min(3, cur.p.charges.filter((c) => c.alive && c.child).length), B = WG[k] || (WG[k] = [0, 0, 0, 0]);
  B[0]++; if (cur.best > 0) B[1]++; if (cur.best + cur.crowd > 0) B[2]++; B[3] += cur.crowd; cur = null;
};
globalThis.crowding = function (p, fh, work) { return (lastCrowd = cw0(p, fh, work)); };
globalThis.childReturn = function (p, world, m) {
  lastCrowd = 0;
  const r = cr0(p, world, m);
  if (p.female) {
    if (cur && cur.p !== p) flushW();
    if (!cur) cur = { p, best: -Infinity, crowd: 0 };
    if (r > cur.best) { cur.best = r; cur.crowd = lastCrowd; }
  }
  return r;
};
globalThis.conceptionDay = function (world) { cur = null; cd0(world); flushW(); };
const wsum = () => { const o = {}; for (const k in WG) { const B = WG[k]; o[k] = [B[0], B[1], B[2], Math.round(B[3] / Math.max(1, B[0]))]; } WG = {}; return o; };

let lastDead = 0, lastMoves = 0, lastJoins = 0, fetches = 0, lastEver = w.agents.length + w.dead.length;
const foodDays = (h) => FOODS.reduce((s, g) => s + (h[g] || 0) * G[g].restores / fd, 0);
const seasons = [];
// each child's death from hunger, the day it died (exp002): its age, whether it was an infant
// (an infant's food is its nursing carer's, ODD §2; an older child eats what it holds), its
// carer (alive?, food level, food-days held, other charges), its mother alive, and its carer's
// camp (members, food-days held by its adults, per adult). Food-days include stores.
const hungerDeaths = [];
let traced = 0;
const fdOf = (a) => foodDays(a.hold) + (a.store ? foodDays(a.store) : 0);
const r1 = (x) => +x.toFixed(1);
const traceChild = (c, d) => {
  const k = c.carer, camp = (k && k.camp) || c.camp, M = camp ? camp.members.filter((a) => a.alive && !a.child) : [];
  return { year: r1(d / Y), age: +(c.ageDays / Y).toFixed(2), infant: isInfant(c), ownFood: r1(fdOf(c)),
    motherAlive: !!(c.mother && c.mother.alive), carer: k ? { alive: k.alive, isMother: k === c.mother, food: +k.need.food.toFixed(2),
      foodDays: r1(fdOf(k)), otherKids: k.charges.filter((x) => x !== c && x.alive).length } : null,
    camp: camp ? { adults: M.length, foodDays: r1(M.reduce((s, a) => s + fdOf(a), 0)), perAdult: r1(M.reduce((s, a) => s + fdOf(a), 0) / Math.max(1, M.length)) } : null };
};
for (let d = 1; d <= years * Y; d++) {
  beat(d, years * Y, ex.label + ' ' + run.name + ' year ' + (d / Y).toFixed(1));
  w.update();
  for (; traced < w.dead.length; traced++) {
    const c = w.dead[traced];
    if (c.child && c.cause === 'hunger') hungerDeaths.push(traceChild(c, d));
  }
  for (const a of w.agents) if (a.plan && a.plan.some((s) => s.act === A_FETCH)) fetches++;
  if (d % Q === 0) {
    const A = w.agents.filter((a) => !a.child);
    const held = A.reduce((s, a) => s + foodDays(a.hold) + (a.store ? foodDays(a.store) : 0), 0) / Math.max(1, A.length);
    const died = w.dead.slice(lastDead); lastDead = w.dead.length;
    const by = {};
    for (const a of died) { const k = (a.child ? 'child ' : 'adult ') + a.cause; by[k] = (by[k] || 0) + 1; }
    let lying = 0;
    if (w.caches) for (const [, c] of w.caches) lying += foodDays(c);
    const gear = {};
    for (const g of GEAR.concat(['pot'])) gear[g] = A.filter((a) => a.hold[g] > 0 || (a.store && a.store[g] > 0)).length;
    const knows = {};
    for (const k of ['tanning', 'basket', 'bag', 'waterskin']) knows[k] = A.filter((a) => a.knows.has(k)).length;
    const ret = {}, si = w.seasonIndex;
    for (const k of ['rbare', 'rbasket', 'rbag']) {
      const v = A.map((a) => a.flow[si][k]).filter((L) => L && L.nh + L.nn > 0).map((L) => L.v).sort((x, y) => x - y);
      ret[k] = v.length ? [+v[v.length >> 1].toFixed(2), v.length] : null;
    }
    const ever = w.agents.length + w.dead.length, births = ever - lastEver; lastEver = ever;
    const ages = new Array(13).fill(0);
    for (const a of w.agents) ages[Math.min(12, Math.floor(a.ageDays / Y / 5))]++;
    const row = { year: +(d / Y).toFixed(2), season: ['spring', 'summer', 'autumn', 'winter'][Math.round(d / Q - 1) % 4],
      alive: w.agents.length, adults: A.length, births, ages, foodDaysPerAdult: +held.toFixed(1), moves: (w.campMoves || 0) - lastMoves,
      joins: (w.campJoins || 0) - lastJoins, camps: (w.camps || []).length, lyingFoodDays: +lying.toFixed(0), gear, knows,
      deaths: by, fetchTrips: fetches, weigh: wsum(), ret };
    seasons.push(row);
    console.log(JSON.stringify(row));
    fetches = 0; lastMoves = w.campMoves || 0; lastJoins = w.campJoins || 0;
    if (saveColony && d % (saveEvery * Y) === 0) saveColony(w, colonyPath(dir, run.name + '_y' + d / Y));
    if (!w.agents.length) break;
  }
}
// --selftest (with --scratch): the trace on a living child, so a short check exercises it
if (has('selftest')) { const c = w.agents.find((a) => a.child); console.log('selftest trace:', c ? JSON.stringify(traceChild(c, years * Y)) : 'no child'); }
await run.save({ seasons, hungerDeaths });
await db.close();
