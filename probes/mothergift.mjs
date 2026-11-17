// A hungry mother's gift sum (exp009, 2026-11-16). Starts from a saved colony and, on every day a
// woman below food level 0 is at exchange with a weaned child in her care below food level 1,
// records the model's own gift sum for one day of that child's food in the food she holds most
// of (ODD §2 Ties, §7.4; exchange.js giftsAt): her cost of giving it (`loss`), her weight on the
// child, the child's gain (needsCost), and whether it pays (weight × gain > loss). Then the
// same sum with her projection's usual food level (`livedFood`, every season) set to her food
// level now, so the projection keeps her hunger instead of fading it back toward her usual
// level (planner.js keepCost; the food-gap fade, `keepPersist`); restored at once. Her child is
// the neediest weaned one with her. Also: her usual level as the projection reads it, whether
// she gave food that day, and whether she died of hunger within 30 days.
// Since exp010: also the child's gain with what it usually receives counted in its
// projection: its mean food received a day through exchange over its last 30 days (level
// units), added each projected day (the rule as Decided counts nothing coming in, ODD §7.4).
// Since exp011: also her cost with her own death priced as the injury forecast prices it (agent.js
// injuryCost: the worst cost × (1 + her weights on her dependents)), by scaling WORST_NEED_COST
// for her sum alone and restoring it at once (`lossDeps`, `paysDeps`).
//   node probes/mothergift.mjs --exp expNNN --from expNNN/<run> --years N [--set a.b=v ...]
import { loadSim, openExperiment, flag, resolveColony, beat } from '../exp.mjs';
const P = loadSim();
const { loadColony } = await import('../colony.mjs');
const fromRef = flag('from'), years = +flag('years', 5);
const { db, ex } = await openExperiment('probes/mothergift.mjs');   // first: --register exits here
const w = loadColony(resolveColony(fromRef));
const sets = process.argv.flatMap((x, i) => x === '--set' ? [process.argv[i + 1]] : []);
for (const s of sets) {
  const [path, v] = s.split('='), keys = path.split('.');
  let o = PARAMETERS; for (const k of keys.slice(0, -1)) o = o[k];
  if (!(keys[keys.length - 1] in o)) throw new Error('no parameter ' + path);
  o[keys[keys.length - 1]] = JSON.parse(v);
}
const run = ex.run(P, { name: fromRef.replace('/', '_'), from: fromRef, years, sets });
await run.start();
const Y = P.year.days, G = P.goods, N = P.needs, r3 = (x) => +x.toFixed(3);
const lvl = (h) => FOODS.reduce((s, g) => s + (h[g] || 0) * G[g].restores, 0);
let today = null;
const recs = [];
// each child's food received through exchange, its last 30 days
const got30 = new Map();
const usualIn = (c) => { const L = got30.get(c.id); return L && L.length ? L.reduce((s, x) => s + x, 0) / L.length : 0; };
// needsCost's child branch (exchange.js) with `inflow` food-level units coming in each day
function childCostIn(j, world, hold, inflow) {
  const e = Agent.evening(j.need, hold, shelterIns(j.shelter), j.busy, true, world.season().cold, PARAMETERS.agents.wakingHours, 1, foodScale(j));
  let c = needCost(e, true, j.need.belonging, j.coldDays);
  const A = PARAMETERS.agents, RF = needReserve('food'), H = A.horizonFar, D = A.discount;
  const deadFrom = (t) => WORST_NEED_COST * Math.pow(D, t) * (1 - Math.pow(D, H - t + 1)) / (1 - D);
  if (e.food <= -RF) return c + deadFrom(1);
  const sq = (x) => (1 - x) * (1 - x), fq = FOODS.map((g) => e.hold[g] || 0), NF = FOODS.length;
  const other = c - sq(needLevel('food', e.food));
  const daily = N.foodDecay * foodScale(j) + N.workBurn * j.busy;
  let food = e.food, beta = 1;
  for (let t = 1; t <= H; t++) {
    beta *= D;
    food -= daily; food += inflow;
    for (let q = 0; q < NF && food < 1; q++) {
      if (!(fq[q] > 0)) continue;
      const eat = Math.min(fq[q], (1 - food) / FOOD_REST[q]);
      food += eat * FOOD_REST[q]; fq[q] -= eat;
    }
    for (let q = 0; q < NF; q++) fq[q] *= CHILD_KEEP[q];
    food = Math.min(food, 1);
    const fl = food >= 0 ? food : Math.max(-1, food / RF);
    if (fl <= -1) return c + beta * (sq(-1) + other) + deadFrom(t + 1);
    c += beta * (sq(fl) + other);
  }
  return c;
}
const gi0 = globalThis.giftsAt, ex0 = globalThis.exchangeDay;
globalThis.giftsAt = function (world, here) {
  for (const k of here) {
    if (k.child || !k.female || !(k.need.food < 0) || today.has(k.id)) continue;
    const kids = here.filter((c) => c.carer === k && !isInfant(c) && c.need.food < 1).sort((a, b) => a.need.food - b.need.food);
    const c = kids[0];
    const g = FOODS.filter((f) => k.hold[f] > 0).sort((a, b) => k.hold[b] * G[b].restores - k.hold[a] * G[a].restores)[0];
    const terms = c && giftTerms(k, c, world.day);
    if (!c || !g || !terms) continue;
    const x = Math.min(k.hold[g], N.foodDecay * foodScale(c) / G[g].restores);
    const gain = needsCost(c, world, c.hold) - needsCost(c, world, { ...c.hold, [g]: c.hold[g] + x });
    const inflow = usualIn(c);
    const gainIn = childCostIn(c, world, c.hold, inflow) - childCostIn(c, world, { ...c.hold, [g]: c.hold[g] + x }, inflow);
    const sum = () => {
      const before = costWith(k, world, k.hold), hold2 = { ...k.hold }; hold2[g] -= x;
      return costWith(k, world, hold2, terms.parent ? k.need.belonging : k.belongingIfGave((terms.via || c).id, world.day)) - before;
    };
    k.mu = null; k._inflow = null;
    const loss = sum();
    const saved = k.livedFood.map((L) => L.v);
    for (const L of k.livedFood) L.v = k.need.food;
    k.mu = null; k._inflow = null;
    const lossKept = sum();
    k.livedFood.forEach((L, i) => { L.v = saved[i]; });
    k.mu = null; k._inflow = null;
    let deps = 0;
    for (const ch of k.charges) if (ch.alive) deps += weightOn(k, ch, world.day);
    const W0 = globalThis.WORST_NEED_COST;
    globalThis.WORST_NEED_COST = W0 * (1 + deps);
    const lossDeps = sum();
    globalThis.WORST_NEED_COST = W0;
    k.mu = null; k._inflow = null;
    today.set(k.id, { day: world.day, id: k.id, food: r3(k.need.food), usual: r3(saved[world.seasonIndex]), childFood: r3(c.need.food),
      weight: r3(terms.weight), x: r3(x * G[g].restores), gain: r3(gain), loss: r3(loss), lossKept: r3(lossKept),
      pays: terms.weight * gain > loss, paysKept: terms.weight * gain > lossKept, before: lvl(k.hold),
      inflow: r3(inflow), gainIn: r3(gainIn), paysIn: terms.weight * gainIn > loss,
      deps: r3(deps), lossDeps: r3(lossDeps), paysDeps: terms.weight * gain > lossDeps });
  }
  return gi0(world, here);
};
globalThis.exchangeDay = function (world, live) {
  today = new Map();
  const kids = live.filter((c) => c.child && c.carer && !isInfant(c)), pre = kids.map((c) => lvl(c.hold));
  const r = ex0(world, live);
  kids.forEach((c, i) => { const L = got30.get(c.id) || (got30.set(c.id, []), got30.get(c.id)); L.push(Math.max(0, lvl(c.hold) - pre[i])); if (L.length > 30) L.shift(); });
  for (const k of live) { const t = today.get(k.id); if (t) { t.gave = r3(t.before - lvl(k.hold)); delete t.before; recs.push(t); } }
  today = null;
  return r;
};
for (let d = 1; d <= years * Y; d++) {
  beat(d, years * Y, ex.label + ' ' + run.name + ' year ' + (d / Y).toFixed(1));
  w.update();
  if (!w.agents.length) break;
}
// did she die of hunger within 30 days of the record
const deadOn = new Map(w.dead.filter((a) => a.cause === 'hunger').map((a) => [a.id, a.deathDay]));
for (const r of recs) { const dd = deadOn.get(r.id); r.diedWithin30 = dd != null && dd >= r.day && dd - r.day <= 30; }
// tallies by her food level, [−6,−5) … [−1,0)
const B = {};
for (const r of recs) {
  const k = Math.max(-6, Math.floor(r.food)), b = B[k] || (B[k] = { paysDeps: 0, lossDeps: 0, deps: 0, paysIn: 0, gainIn: 0, inflow: 0, n: 0, pays: 0, paysKept: 0, gave: 0, died30: 0, loss: 0, lossKept: 0, wgain: 0, usual: 0 });
  if (r.paysDeps) b.paysDeps++; b.lossDeps += r.lossDeps; b.deps += r.deps;
  if (r.paysIn) b.paysIn++; b.gainIn += r.weight * r.gainIn; b.inflow += r.inflow;
  b.n++; if (r.pays) b.pays++; if (r.paysKept) b.paysKept++; if (r.gave > 1e-6) b.gave++; if (r.diedWithin30) b.died30++;
  b.loss += r.loss; b.lossKept += r.lossKept; b.wgain += r.weight * r.gain; b.usual += r.usual;
}
const byLevel = {};
for (const k of Object.keys(B).sort((a, b) => a - b)) {
  const b = B[k], m = (x) => +(x / b.n).toFixed(4);
  byLevel[k] = { days: b.n, pays: b.pays, paysKept: b.paysKept, gave: b.gave, diedWithin30: b.died30,
    meanLoss: m(b.loss), meanLossKept: m(b.lossKept), meanWeightedGain: m(b.wgain), meanUsual: m(b.usual),
    paysIn: b.paysIn, meanWeightedGainIn: m(b.gainIn), meanChildInflow: m(b.inflow),
    paysDeps: b.paysDeps, meanLossDeps: m(b.lossDeps), meanDeps: m(b.deps) };
}
console.log(JSON.stringify(byLevel, null, 1));
await run.save({ byLevel, sample: recs.filter((r) => r.diedWithin30).slice(0, 300) });
await db.close();
