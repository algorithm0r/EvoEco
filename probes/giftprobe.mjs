// Why a carer does not feed a hungry child (exp003, 2026-11-14). Starts from a saved colony and,
// on every day a child with a carer is in food deficit (food level below 0; infants excluded,
// they live on milk), records at exchange time: what the carer holds in hand and in her store,
// and the gift sum the model itself makes for one day of the child's food (ODD §2 Ties, §7.4;
// exchange.js giftsAt): the carer's own cost of giving it up, her weight on the child, and the
// child's gain (needsCost). Then what the child was given that day, and whether it died.
// Since exp004 also totals: child-days past nursing, children's deaths by cause, births; and on
// days the sum says a day's food pays but the child got none, where the carer's gifts went.
//   node probes/giftprobe.mjs --exp expNNN --from expNNN/<run> --years N
import { loadSim, openExperiment, flag, resolveColony, beat } from '../exp.mjs';
const P = loadSim();
const { loadColony } = await import('../colony.mjs');
const fromRef = flag('from'), years = +flag('years', 5);
const { db, ex } = await openExperiment('probes/giftprobe.mjs');   // first: --register exits here
const w = loadColony(resolveColony(fromRef));
const run = ex.run(P, { name: fromRef.replace('/', '_'), from: fromRef, years });
await run.start();
const Y = P.year.days, G = P.goods, N = P.needs;

const lvl = (h) => FOODS.reduce((s, g) => s + (h[g] || 0) * G[g].restores, 0);   // food level units
let today = null;   // child id -> record, for the day in progress
const gi0 = globalThis.giftsAt, ex0 = globalThis.exchangeDay, bg0 = globalThis.bookGift;
// each giver's gifts today (since exp004): giver id -> receivers
let gaveTo = new Map();
globalThis.bookGift = function (i, j, terms, day) { (gaveTo.get(i.id) || gaveTo.set(i.id, []).get(i.id)).push(j); return bg0(i, j, terms, day); };
globalThis.giftsAt = function (world, here) {
  for (const c of here) {
    if (!c.child || !c.carer || isInfant(c) || !(c.need.food < 0) || today.has(c.id)) continue;
    const k = c.carer;
    if (!here.includes(k)) continue;
    const dayFood = N.foodDecay * foodScale(c);   // one day of the child's food, level units
    const terms = giftTerms(k, c, world.day);
    const r = { level: c.need.food, carerLevel: k.need.food, isMother: k === c.mother,
      handDays: lvl(k.hold) / dayFood, storeDays: k.store ? lvl(k.store) / dayFood : 0,
      weight: terms ? terms.weight : null, sum: null, before: lvl(c.hold) };
    // the model's gift sum for a day of the child's food, in the food the carer holds most of
    const g = FOODS.filter((f) => k.hold[f] > 0).sort((a, b) => k.hold[b] * G[b].restores - k.hold[a] * G[a].restores)[0];
    if (g && terms) {
      const x = Math.min(k.hold[g], dayFood / G[g].restores);
      const before = costWith(k, world, k.hold), hold2 = { ...k.hold }; hold2[g] -= x;
      const loss = costWith(k, world, hold2, terms.parent ? k.need.belonging : k.belongingIfGave((terms.via || c).id, world.day)) - before;
      const gain = needsCost(c, world, c.hold) - needsCost(c, world, { ...c.hold, [g]: c.hold[g] + x });
      r.sum = { good: g, x: +x.toFixed(3), carerLoss: loss, childGain: gain, weighted: terms.weight * gain, pays: terms.weight * gain > loss };
    }
    today.set(c.id, r);
  }
  return gi0(world, here);
};
globalThis.exchangeDay = function (world, live) {
  today = new Map(); gaveTo = new Map();
  const r = ex0(world, live);
  for (const c of live) {
    const t = today.get(c.id); if (!t) continue;
    t.given = lvl(c.hold) - t.before;
    // where the carer's gifts went today: another of her charges, another child, an adult
    const to = (gaveTo.get(c.carer.id) || []).filter((x) => x !== c);
    t.carerGave = { charge: to.filter((x) => c.carer.charges.includes(x)).length, child: to.filter((x) => x.child && !c.carer.charges.includes(x)).length, adult: to.filter((x) => !x.child).length };
  }
  return r;
};

// aggregate by the child's level: [−6,−5), …, [−1,0)
const B = {}, near = [];
// totals (since exp004): days lived by children with a carer past nursing, children's deaths by
// cause, births, and the living at the end
const tot = { childDays: 0, childDeaths: {}, births: 0 };
let seenDead = w.dead.length, ever = w.agents.length + w.dead.length;
const bucket = (x) => Math.max(-6, Math.floor(x));
for (let d = 1; d <= years * Y; d++) {
  beat(d, years * Y, ex.label + ' ' + run.name + ' year ' + (d / Y).toFixed(1));
  w.update();
  for (const a of w.agents) if (a.child && a.carer && !isInfant(a)) tot.childDays++;
  for (; seenDead < w.dead.length; seenDead++) { const a = w.dead[seenDead]; if (a.child) tot.childDeaths[a.cause] = (tot.childDeaths[a.cause] || 0) + 1; }
  { const e = w.agents.length + w.dead.length; tot.births += e - ever; ever = e; }
  if (!today) continue;
  for (const [id, r] of today) {
    const died = !w.agents.some((a) => a.id === id);
    const k = bucket(r.level), b = B[k] || (B[k] = { paysNotGot: 0, wentCharge: 0, wentChild: 0, wentAdult: 0, wentNowhere: 0, n: 0, carerHasDay: 0, storeHasDay: 0, given: 0, sumPays: 0, sumRun: 0, carerLoss: 0, weighted: 0, weight: 0, carerLevel: 0, died: 0 });
    b.n++; b.carerLevel += r.carerLevel;
    if (r.handDays >= 1) b.carerHasDay++;
    if (r.storeDays >= 1) b.storeHasDay++;
    if (r.given > 1e-6) b.given++;
    if (died) b.died++;
    if (r.sum && r.sum.pays && !(r.given > 1e-6)) {
      b.paysNotGot++; const cg = r.carerGave || { charge: 0, child: 0, adult: 0 };
      if (cg.charge) b.wentCharge++; if (cg.child) b.wentChild++; if (cg.adult) b.wentAdult++; if (!cg.charge && !cg.child && !cg.adult) b.wentNowhere++;
    }
    if (r.sum) { b.sumRun++; b.carerLoss += r.sum.carerLoss; b.weighted += r.sum.weighted; b.weight += r.weight; if (r.sum.pays) b.sumPays++; }
    if (r.level < -4.5 && near.length < 400) near.push({ year: +(d / Y).toFixed(2), id, died, ...r, sum: r.sum && { ...r.sum, carerLoss: +r.sum.carerLoss.toFixed(4), childGain: +r.sum.childGain.toFixed(4), weighted: +r.sum.weighted.toFixed(4) } });
  }
  today = null;
  if (d % Y === 0) console.log('year', (d / Y), JSON.stringify(Object.fromEntries(Object.entries(B).map(([k, b]) => [k, b.n]))));
}
const byLevel = {};
for (const k of Object.keys(B).sort((a, b) => a - b)) {
  const b = B[k], m = (x, n) => n ? +(x / n).toFixed(4) : null;
  byLevel[k] = { childDays: b.n, carerHeldDay: b.carerHasDay, carerStoreHeldDay: b.storeHasDay, gotFood: b.given, died: b.died,
    sumsRun: b.sumRun, sumPays: b.sumPays, meanCarerLoss: m(b.carerLoss, b.sumRun), meanWeightedGain: m(b.weighted, b.sumRun),
    meanWeight: m(b.weight, b.sumRun), meanCarerLevel: m(b.carerLevel, b.n),
    paysButGotNothing: b.paysNotGot, carerGaveInsteadTo: { charge: b.wentCharge, otherChild: b.wentChild, adult: b.wentAdult, nobody: b.wentNowhere } };
}
console.log(JSON.stringify(byLevel, null, 1));
tot.alive = w.agents.length; tot.adults = w.agents.filter((a) => !a.child).length;
console.log(JSON.stringify(tot));
await run.save({ byLevel, nearDeath: near, totals: tot });
await db.close();
