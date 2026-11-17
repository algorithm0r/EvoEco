// Why a fed mother and her children die of thirst together (scratch check, 2026-11-16; not a
// registered experiment). From exp002/limit_s1_y30, for each woman with 3+ children in her care
// who dies of thirst: her state on the first dry day of her last dry spell and the day before
// she died (water, food, hours after care, care, injury, drink trip, plan, children's water).
// Run on the model as of 2026-11-16 before the self-care rules (ODD §7.4).
//   node probes/thirsttrace.mjs [days]
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';
const SIM = fileURLToPath(new URL('../', import.meta.url));
const { loadSim, resolveColony } = await import(pathToFileURL(SIM + 'exp.mjs').href);
loadSim();
const { loadColony } = await import(pathToFileURL(SIM + 'colony.mjs').href);
const w = loadColony(resolveColony('exp002/limit_s1_y30'));
const days = +(process.argv[2] || 105);
const watch = new Set(), last = new Map(), first = new Map();
for (let d = 1; d <= days; d++) {
  w.update();
  for (const a of w.agents) {
    if (a.child || !a.female || a.charges.filter((c) => c.alive).length < 3) continue;
    if (!(a.need.water < 0.6)) { first.delete(a.id); continue; }
    watch.add(a.id);
    const tr = w.travel(a.home);
    const rec = ({ d, id: a.id, water: +a.need.water.toFixed(2), food: +a.need.food.toFixed(2), drank: a.drank,
      cap: +a.capacity().toFixed(2), care: +careLoad(a).toFixed(2), work: +workingHours(a).toFixed(2), walked: +(a.walked || 0).toFixed(2), hurt: a.hurt,
      drinkTrip: +a.drinkTrip.toFixed(2), at: a.at, home: a.home, toHome: a.at >= 0 ? +tr[a.at].toFixed(2) : 0, waterKnownFromHome: +knownWaterFrom(a, w, a.home).toFixed(2),
      out: !!(a.plan && a.plan.out), plan: (a.plan || []).map((s) => s.act + '@' + s.hex).join(' '), held: +(a.hold.water || 0).toFixed(2),
      kids: a.charges.filter((c) => c.alive).map((c) => ageYears(c).toFixed(1) + ':' + c.need.water.toFixed(2)).join(' ') });
    if (!first.has(a.id)) first.set(a.id, rec); last.set(a.id, rec);
  }
  for (const id of [...watch]) if (!w.agents.some((a) => a.id === id)) { const x = w.dead.find((b) => b.id === id); if (x && x.cause === 'thirst') { console.log('DEAD', id, 'day', d, x.cause); console.log(' first dry', JSON.stringify(first.get(id))); console.log(' last', JSON.stringify(last.get(id))); } watch.delete(id); }
}
