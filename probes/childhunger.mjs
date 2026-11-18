// Hungry children beside fed mothers (exp016, 2026-11-17). From a fresh world, or a saved colony
// with --from, records every day a weaned child in its mother's care ends the evening below food
// level 0 while she ends it at 0.5 or above. At the start of that day's exchange (before any
// gift): the food she holds and the child holds (food-level units: amount × restores), what she
// gathered that day (`got`), whether she is out for the night, her weight on the child, and
// whether her gift to it would pay her by the model's own sum (exchange.js giftFor: the child's
// whole shortfall, or else a day's food, in any food she holds; weight × the child's gain >
// her cost). After the exchange: what she gave the child, and what she gave in all. After the
// evening: her food level and what she holds. Also the same at-exchange readings for every
// weaned child in its mother's care that day, for comparison.
// Since exp017: also her carrying gear (tree.js carryGear: bag, basket or bare hands) and whether
// what she carries of loose goods has reached her loose capacity (tree.js kindCap), at exchange.
//   node probes/childhunger.mjs --exp expNNN --seed S --days D [--from expNNN/<run>]
import { loadSim, openExperiment, flag, resolveColony, beat } from '../exp.mjs';
const P = loadSim();
const fromRef = flag('from', null), seed = +flag('seed', 1), days = +flag('days', 60);
if (!fromRef) P.seed = seed;
const { db, ex } = await openExperiment('probes/childhunger.mjs');
let w;
if (fromRef) { const { loadColony } = await import('../colony.mjs'); w = loadColony(resolveColony(fromRef)); }
const run = ex.run(P, { name: fromRef ? fromRef.replace('/', '_') : 's' + seed, seed, days, from: fromRef });
await run.start();
if (!w) w = new World();
const G = P.goods, N = P.needs, r3 = (x) => +x.toFixed(3);
const lvl = (h) => FOODS.reduce((s, g) => s + (h[g] || 0) * G[g].restores, 0);
// would m's gift of food to c pay m, as giftFor sums it
function pays(m, c, world) {
  const terms = giftTerms(m, c, world.day);
  if (!terms) return false;
  const before = costWith(m, world, m.hold);
  for (const g of FOODS) {
    if (!(m.hold[g] > 0)) continue;
    const need = shortfall(c, g);
    if (!(need > 0)) return false;
    const sizes = [Math.min(need, m.hold[g]), Math.min(need, m.hold[g], N.foodDecay * foodScale(c) / G[g].restores)];
    for (const x of sizes) {
      if (!(x > 1e-6)) continue;
      const hold2 = { ...m.hold }; hold2[g] -= x;
      let after = costWith(m, world, hold2, m.need.belonging);
      if (terms.weight > 0) after -= terms.weight * (needsCost(c, world, c.hold) - needsCost(c, world, { ...c.hold, [g]: c.hold[g] + x }));
      if (after < before) return true;
    }
  }
  return false;
}
let pre = null;
const ex0 = globalThis.exchangeDay;
globalThis.exchangeDay = function (world, live) {
  pre = new Map();
  for (const c of live) {
    const m = c.mother;
    if (!c.child || isInfant(c) || !m || !m.alive || c.carer !== m) continue;
    m.mu = null; c.mu = null;
    pre.set(c.id, { c, m, mHold: lvl(m.hold), cHold: lvl(c.hold), mGot: lvl(m.got), mOut: !!m.out, weight: weightOn(m, c, world.day),
      gear: carryGear(m.hold), looseFull: !!(m.carried && m.carried.loose >= kindCap(m.hold, 'loose') - 1e-6),
      pays: pays(m, c, world), mFoodAm: m.need.food, cFoodAm: c.need.food, age: c.ageDays / P.year.days, charges: m.charges.filter((k) => k.alive).length });
    m.mu = null; c.mu = null;
  }
  const r = ex0(world, live);
  for (const p of pre.values()) { p.toChild = lvl(p.c.hold) - p.cHold; p.mGave = p.mHold - lvl(p.m.hold); }
  return r;
};
const all = [], cases = [];
for (let d = 1; d <= days; d++) {
  beat(d, days, ex.label + ' ' + run.name + ' day ' + d);
  w.update();
  for (const p of pre.values()) {
    const row = { day: w.day, child: p.c.id, mother: p.m.id, age: r3(p.age), charges: p.charges, weight: r3(p.weight), pays: p.pays, gear: p.gear, looseFull: p.looseFull,
      mHold: r3(p.mHold), cHold: r3(p.cHold), mGot: r3(p.mGot), mOut: p.mOut, toChild: r3(p.toChild), mGave: r3(p.mGave),
      mFoodAm: r3(p.mFoodAm), cFoodAm: r3(p.cFoodAm) };
    if (p.c.alive && p.m.alive) { row.cFood = r3(p.c.need.food); row.mFood = r3(p.m.need.food); row.mHoldNight = r3(lvl(p.m.hold)); }
    all.push(row);
    if (row.cFood < 0 && row.mFood >= 0.5) cases.push(row);
  }
  pre = null;
}
const med = (x) => { const s = x.slice().sort((a, b) => a - b); return s.length ? r3(s[s.length >> 1]) : null; };
const sum = (R) => ({ days: R.length, bare: R.filter((r) => r.gear === 'bare').length, looseFull: R.filter((r) => r.looseFull).length,
  bareLooseFull: R.filter((r) => r.gear === 'bare' && r.looseFull).length, mHeldFood: R.filter((r) => r.mHold > 0.01).length, pays: R.filter((r) => r.pays).length,
  gaveChild: R.filter((r) => r.toChild > 0.001).length, mGotNone: R.filter((r) => r.mGot <= 0.01).length, mOut: R.filter((r) => r.mOut).length,
  medMHold: med(R.map((r) => r.mHold)), medMGot: med(R.map((r) => r.mGot)), medCHold: med(R.map((r) => r.cHold)), medWeight: med(R.map((r) => r.weight)),
  medToChild: med(R.map((r) => r.toChild)), medMGave: med(R.map((r) => r.mGave)), medCharges: med(R.map((r) => r.charges)), medAge: med(R.map((r) => r.age)),
  medMFood: med(R.filter((r) => r.mFood != null).map((r) => r.mFood)), medMHoldNight: med(R.filter((r) => r.mHoldNight != null).map((r) => r.mHoldNight)) });
const out = { cases: sum(cases), all: sum(all),
  casesHeldNotPaid: sum(cases.filter((r) => r.mHold > 0.01 && !r.pays)), casesHeldPaid: sum(cases.filter((r) => r.mHold > 0.01 && r.pays)),
  casesNoneHeld: sum(cases.filter((r) => r.mHold <= 0.01)),
  childHungerDead: w.dead.filter((a) => a.cause === 'hunger' && a.ageDays < P.life.matureAge * P.year.days && (!fromRef || a.deathDay > w.day - days)).length };
console.log(JSON.stringify(out));
await run.save({ summary: out, sample: cases.slice(0, 400) });
await db.close();
