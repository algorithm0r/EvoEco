// The starting children's first 60 days (exp013, 2026-11-17). From a fresh world (ODD §5
// Children at the start), every 10 days, over the weaned children whose mother is alive: how
// many have a mother whose weight on them is 0 (life.js weightOn; with no ties her expectation
// of a grown child has nothing to come from), the mean weight, how many are below food level 0,
// and of those: how many have a mother at weight 0, the median food their mother holds (in
// food-level units) and her food level, all read after the day's update (after evening).
// Also child hunger deaths so far.
//   node probes/startweight.mjs --exp expNNN --seed 1 [--days 60]
import { loadSim, openExperiment, flag } from '../exp.mjs';
const P = loadSim();
const seed = +flag('seed', 1), days = +flag('days', 60);
P.seed = seed;
const { db, ex } = await openExperiment('probes/startweight.mjs');
const run = ex.run(P, { name: 's' + seed, seed, days });
await run.start();
const w = new World(), G = P.goods;
const lvl = (h) => FOODS.reduce((s, g) => s + (h[g] || 0) * G[g].restores, 0);
const med = (x) => { const s = x.slice().sort((a, b) => a - b); return s.length ? +s[s.length >> 1].toFixed(3) : null; };
const rows = [];
const read = () => {
  const K = w.agents.filter((a) => a.child && a.mother && a.mother.alive && !isInfant(a));
  const W = K.map((c) => weightOn(c.mother, c, w.day)), H = K.filter((c) => c.need.food < 0);
  const r = { day: w.day, weaned: K.length, weight0: W.filter((x) => !(x > 0)).length, meanWeight: +(W.reduce((s, x) => s + x, 0) / (W.length || 1)).toFixed(3),
    hungry: H.length, hungryWeight0: H.filter((c) => !(weightOn(c.mother, c, w.day) > 0)).length,
    hungryMotherHolds: med(H.map((c) => lvl(c.mother.hold))), hungryMotherFood: med(H.map((c) => c.mother.need.food)),
    childHungerDead: w.dead.filter((a) => a.cause === 'hunger' && a.ageDays < P.life.matureAge * P.year.days).length };
  rows.push(r); console.log(JSON.stringify(r));
};
read();
for (let d = 1; d <= days; d++) { w.update(); if (d % 10 === 0) read(); }
await run.save({ rows });
await db.close();
