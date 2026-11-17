// Why mothers starve (exp008, 2026-11-16). Starts from a saved colony and keeps, for every woman
// with children alive in her care, a daily record over the last `--window` days (default 45):
// her food level that evening; food she held after the evening; food she gathered (`got`); her
// net through exchange (`xnet`: gifts and barter, out negative); her charges' net through
// exchange, their mean food level, how many; and her hours after care. All food in food-level
// units (amount × restores). When such a woman dies of hunger, her window is saved, with the
// same days for up to two other women with children in her camp who were alive at the end of it.
//   node probes/mothersprobe.mjs --exp expNNN --from expNNN/<run> --years N [--set a.b=v ...]
import { loadSim, openExperiment, flag, resolveColony, beat } from '../exp.mjs';
const P = loadSim();
const { loadColony } = await import('../colony.mjs');
const fromRef = flag('from'), years = +flag('years', 5), win = +flag('window', 45);
const { db, ex } = await openExperiment('probes/mothersprobe.mjs');   // first: --register exits here
const w = loadColony(resolveColony(fromRef));
const sets = process.argv.flatMap((x, i) => x === '--set' ? [process.argv[i + 1]] : []);
for (const s of sets) {
  const [path, v] = s.split('='), keys = path.split('.');
  let o = PARAMETERS; for (const k of keys.slice(0, -1)) o = o[k];
  if (!(keys[keys.length - 1] in o)) throw new Error('no parameter ' + path);
  o[keys[keys.length - 1]] = JSON.parse(v);
}
const run = ex.run(P, { name: fromRef.replace('/', '_'), from: fromRef, years, sets, window: win });
await run.start();
const Y = P.year.days, G = P.goods, r2 = (x) => +x.toFixed(2);
const lvl = (h) => FOODS.reduce((s, g) => s + (h[g] || 0) * G[g].restores, 0);
const net = (a) => a.xnet ? FOODS.reduce((s, g) => s + (a.xnet[g] || 0) * G[g].restores, 0) : 0;
const got = (a) => FOODS.reduce((s, g) => s + (a.got[g] || 0) * G[g].restores, 0);
const buf = new Map();   // woman id -> [day records]
const cases = [];
let seen = w.dead.length;
for (let d = 1; d <= years * Y; d++) {
  beat(d, years * Y, ex.label + ' ' + run.name + ' year ' + (d / Y).toFixed(1));
  const cap = new Map();
  for (const a of w.agents) if (a.female && !a.child && a.charges.some((c) => c.alive)) cap.set(a.id, r2(a.capacity()));
  w.update();
  for (const a of w.agents) {
    if (!cap.has(a.id)) continue;
    const K = a.charges.filter((c) => c.alive);
    const rec = { day: d, food: r2(a.need.food), held: r2(lvl(a.hold) + (a.store ? lvl(a.store) : 0)), got: r2(got(a)), xnet: r2(net(a)),
      kidsXnet: r2(K.reduce((s, c) => s + net(c), 0)), kidsFood: K.length ? r2(K.reduce((s, c) => s + c.need.food, 0) / K.length) : null,
      kids: K.length, infants: K.filter((c) => isInfant(c)).length, cap: cap.get(a.id) };
    const B = buf.get(a.id) || (buf.set(a.id, []), buf.get(a.id));
    B.push(rec); if (B.length > win) B.shift();
  }
  for (; seen < w.dead.length; seen++) {
    const a = w.dead[seen];
    if (a.child || !a.female || a.cause !== 'hunger' || !buf.has(a.id)) continue;
    const camp = a.camp ? a.camp.members : [];
    const peers = camp.filter((b) => b !== a && b.alive && buf.has(b.id)).slice(0, 2);
    cases.push({ year: r2(d / Y), id: a.id, age: r2(a.ageDays / Y), window: buf.get(a.id),
      peers: peers.map((b) => ({ id: b.id, age: r2(b.ageDays / Y), window: buf.get(b.id).filter((r) => r.day > d - win) })) });
    console.log('case', cases.length, 'year', r2(d / Y), 'woman', a.id, 'peers', peers.length);
  }
  for (const id of [...buf.keys()]) if (!w.agents.some((a) => a.id === id)) buf.delete(id);
  if (!w.agents.length) break;
}
// --selftest (with --scratch): the last days of one living mother's record
if (process.argv.includes('--selftest')) { const [id, B] = [...buf.entries()][0] || []; console.log('selftest', id, JSON.stringify(B && B.slice(-3))); }
await run.save({ cases });
await db.close();
