// What weight parents in a running world put on their children (exp014, 2026-11-17), to give
// the starting parents that value (ODD §5 Children at the start: starting mothers value their
// children like normal, Decided 2026-11-17). From a saved colony, over every living parent of a
// living child: the expected weight of a grown child (`grown`, life.js expectedChildWeight before
// the survival chance: learned from its own grown children, or its strongest tie's share), its
// survival chance, and their product; split by mothers and fathers, and by whether `grown` is
// learned. One run per colony; reads only, does not step the world.
//   node probes/normalweight.mjs --exp expNNN --from expNNN/<run>
import { loadSim, openExperiment, flag, resolveColony } from '../exp.mjs';
const P = loadSim();
const { loadColony } = await import('../colony.mjs');
const fromRef = flag('from');
const { db, ex } = await openExperiment('probes/normalweight.mjs');
const w = loadColony(resolveColony(fromRef));
const run = ex.run(P, { name: fromRef.replace('/', '_'), from: fromRef });
await run.start();
const q = (x) => { const s = x.slice().sort((a, b) => a - b), at = (p) => s.length ? +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(3) : null;
  return { n: s.length, q25: at(0.25), med: at(0.5), q75: at(0.75), mean: s.length ? +(s.reduce((a, b) => a + b, 0) / s.length).toFixed(3) : null }; };
const out = {};
for (const sex of ['mothers', 'fathers']) {
  const ps = w.agents.filter((a) => a.alive && !a.child && (sex === 'mothers') === a.female && a.kids.some((c) => c.alive && c.child && isParent(a, c)));
  const grown = (a) => { const L = a.childL; return L.nh > 0 || L.nn > 0 ? L.v : (strongestTie(a, w.day) || { w: 0 }).w; };
  const learned = ps.filter((a) => a.childL.nh > 0 || a.childL.nn > 0);
  out[sex] = { grown: q(ps.map(grown)), survival: q(ps.map(survivalChance)), weight: q(ps.map((a) => expectedChildWeight(a, w.day))),
    learned: learned.length, grownLearned: q(learned.map(grown)), grownFromTie: q(ps.filter((a) => !learned.includes(a)).map(grown)) };
}
out.day = w.day;
console.log(JSON.stringify(out));
await run.save(out);
await db.close();
