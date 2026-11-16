// Every death, and a yearly census (exp005, 2026-11-15). Starts from a saved colony and records,
// for each agent that dies, the day it died: age, sex, cause, food and water levels, whether it
// was a child (and an infant), the children in its care, and for a child whether its carer was
// alive and its mother alive. Once a year: alive, adults, children, infants, women with children
// in their care.
//   node probes/deathprobe.mjs --exp expNNN --from expNNN/<run> --years N
import { loadSim, openExperiment, flag, resolveColony, beat } from '../exp.mjs';
const P = loadSim();
const { loadColony } = await import('../colony.mjs');
const fromRef = flag('from'), years = +flag('years', 5);
const { db, ex } = await openExperiment('probes/deathprobe.mjs');   // first: --register exits here
const w = loadColony(resolveColony(fromRef));
const run = ex.run(P, { name: fromRef.replace('/', '_'), from: fromRef, years });
await run.start();
const Y = P.year.days, r2 = (x) => +x.toFixed(2);
const census = (d) => {
  const A = w.agents, kids = A.filter((a) => a.child);
  return { year: r2(d / Y), alive: A.length, adults: A.length - kids.length, children: kids.length,
    infants: kids.filter((a) => isInfant(a)).length,
    mothersWithCharges: A.filter((a) => !a.child && a.female && a.charges.some((c) => c.alive)).length };
};
const deaths = [], years_ = [census(0)];
let seen = w.dead.length;
for (let d = 1; d <= years * Y; d++) {
  beat(d, years * Y, ex.label + ' ' + run.name + ' year ' + (d / Y).toFixed(1));
  w.update();
  for (; seen < w.dead.length; seen++) {
    const a = w.dead[seen];
    deaths.push({ year: r2(d / Y), age: r2(a.ageDays / Y), female: !!a.female, cause: a.cause, child: !!a.child,
      infant: a.child ? isInfant(a) : false, food: r2(a.need.food), water: r2(a.need.water),
      charges: a.charges.filter((c) => c.alive).length,
      carerAlive: a.child ? !!(a.carer && a.carer.alive) : null, motherAlive: a.child ? !!(a.mother && a.mother.alive) : null });
  }
  if (d % Y === 0) { const c = census(d); years_.push(c); console.log(JSON.stringify(c)); }
  if (!w.agents.length) break;
}
// tallies: cause by age group (infant, child 2–14, adult 15–44, 45+), and adults by sex
const group = (x) => x.infant ? 'infant' : x.child ? 'child' : x.age < 45 ? 'adult15-44' : 'adult45+';
const by = {};
for (const x of deaths) { const k = group(x) + ' ' + (x.child ? '' : (x.female ? 'F ' : 'M ')) + x.cause; by[k] = (by[k] || 0) + 1; }
console.log(JSON.stringify(by, null, 1));
await run.save({ census: years_, deaths, tally: by });
await db.close();
