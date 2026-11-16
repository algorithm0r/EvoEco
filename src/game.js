'use strict';
// Game (ODD §2 Landscape and resources, Game: Decided — Chris, 2026-11-11). Densities, not
// animals as agents:
// - Small game is a flow: a density on each hex (the resource `smallgame`, so it is gathered
//   like any resource) that breeds where it stands, in spring and summer, up to a ceiling, and
//   seeps into emptier neighbouring hexes. Its predator is its own density, damped: its take
//   saturates and predators crowd each other, so the two wobble round a balance; the weather
//   varies breeding year to year.
// - Big game is herds: concentrations that move toward grazing and water and away from the
//   predator and people traces. Their predator is packs that climb the herd trace. Herds graze
//   a stock of their own (grass, and browse under trees that lasts the winter), so they eat a
//   place down and move on.
// - Traces (tracking as pheromones): herds, packs and people each mark the hexes they pass; a
//   trace fades daily and seeps a little to the neighbours, so it has a gradient to climb.
// The world calls gameInit once (lazily, so colonies saved before game load) and gameDay daily.

function gameInit(world) {
  const P = PARAMETERS.game, g = world.grid, n = g.n, rng = world.rng;
  if (!world.caps.smallgame) {   // a colony saved before game: its ceilings by terrain, as mapgen sets them
    const by = PARAMETERS.resources.smallgame.capBy;
    world.caps.smallgame = Float32Array.from(world.terrain, (t) => by[TERRAIN[t]] || 0);
  }
  const K = world.caps.smallgame;
  if (!world.stock.smallgame) world.stock.smallgame = Float32Array.from(K);   // a colony saved before game
  if (!world.active.smallgame) { const a = []; for (let i = 0; i < n; i++) if (K[i] > 0) a.push(i); world.active.smallgame = Int32Array.from(a); }
  const G = {
    pred: new Float32Array(n),          // small game's predator, per hex (1 = its usual load)
    graze: new Float32Array(n),         // the herds' grazing stock, in animal-days
    trace: { herd: new Float32Array(n), pack: new Float32Array(n), people: new Float32Array(n) },
    herds: [], packs: [],
    weather: 1, weatherYear: -1,
    kills: { herds: 0, packs: 0 },     // animals taken from herds, by people and by packs (measures)
  };
  for (let i = 0; i < n; i++) {
    if (K[i] > 0) { world.stock.smallgame[i] = K[i] * P.small.start; G.pred[i] = P.pred.start; }
    G.graze[i] = grazeCap(world, i);
  }
  // herds and packs start on land, spread at random
  const land = [];
  for (let i = 0; i < n; i++) if (world.land[i] > 0 && world.hours[i] >= 0) land.push(i);
  for (let k = 0; k < P.herd.n; k++) G.herds.push({ hex: land[rng.int(land.length)], n: P.herd.start, fed: 1 });
  for (let k = 0; k < P.pack.n; k++) G.packs.push({ hex: land[rng.int(land.length)], n: P.pack.start });
  world.game = G;
  for (const a of world.agents) gameAgent(a, world);
}

// An agent from a colony saved before game (Stage 5h): the new activities, goods, flows and
// sightings, as a new agent has them; the spear is pre-known (ODD §2 Game, Decided).
function gameAgent(a, world) {
  const A = PARAMETERS.agents, n = world.grid.n;
  while (a.yld.length < ACT_NAMES.length) a.yld.push(newLearned(A.priorPerHour[ACT_NAMES[a.yld.length]] || 0));
  for (const g of SEEN) if (!a.seenFrac[g]) a.seenFrac[g] = new Float32Array(n);
  a.hold = Object.assign(newHold(), a.hold);   // every good, as one fast object (tree.js newHold)
  for (const F of a.flow) for (const k of FLOW_KEYS) if (!F[k]) F[k] = newLearned(0);
  for (const g of FLOW_GOODS) { if (a.got[g] == null) a.got[g] = 0; if (a.xnet && a.xnet[g] == null) a.xnet[g] = 0; }
  if (!a.herdH) { a.herdH = new Uint16Array(4 * n); a.herdN = new Uint16Array(4 * n); a.herdMiss = { eh: -1, en: -1 }; a.gotGame = 0; }
  if (A.knowhow.indexOf('spear') >= 0) a.knows.add('spear');
  if (!a.injL) newInjury(a);
}

// what a hex's grazing holds when full: grass, and browse under trees (animal-days)
function grazeCap(world, i) {
  const H = PARAMETERS.game.graze, L = world.land[i];
  if (!(L > 0)) return 0;
  return L * (H.grass * world.cover.grass[i] + H.browse * world.cover.trees[i]);
}

function gameDay(world, sea) {
  if (!world.game) gameInit(world);
  const G = world.game, P = PARAMETERS.game;
  const year = Math.floor(world.day / PARAMETERS.year.days);
  if (year !== G.weatherYear) {
    // this year's breeding weather, shared across the map (lognormal about 1)
    G.weatherYear = year;
    G.weather = lognormal(world.rng, P.weatherSd);
    G.wolfYear = lognormal(world.rng, P.pack.sd);   // this year's draw on wolf numbers
  }
  tracesDay(world);
  smallGameDay(world, sea);
  grazeDay(world, sea);
  herdsDay(world, sea);
  packsDay(world, sea);
}

// a draw about 1, lognormal with log-sd `sd`
function lognormal(rng, sd) {
  const u = Math.max(1e-9, rng()), v = rng();
  return Math.exp(sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v) - sd * sd / 2);
}

// ── traces ───────────────────────────────────────────────────────────────────────────────
// Each fades by `fade` a day and seeps `seep` of itself toward the mean of its neighbours.
function tracesDay(world) {
  const T = PARAMETERS.game.trace, g = world.grid, n = g.n;
  for (const k in world.game.trace) {
    const x = world.game.trace[k], keep = 1 - T.fade[k];
    const y = TRACE_SCRATCH.length === n ? TRACE_SCRATCH : (TRACE_SCRATCH = new Float32Array(n));
    for (let i = 0; i < n; i++) {
      let s = 0, m = 0;
      for (let d = 0; d < 6; d++) { const j = g.nbr[i * 6 + d]; if (j >= 0) { s += x[j]; m++; } }
      y[i] = keep * ((1 - T.seep) * x[i] + (m ? T.seep * s / m : 0));
    }
    x.set(y);
  }
}
var TRACE_SCRATCH = new Float32Array(0);
// mark a hex (people: each place an agent was today; herds and packs: each hex they pass)
function leaveTrace(world, kind, hex, amount) {
  if (!world.game) gameInit(world);
  world.game.trace[kind][hex] += amount;
}

// ── small game and its predator ──────────────────────────────────────────────────────────
// Per hex, as fullness x = stock / ceiling and predator load y: breeding r·x·(1 − x) in the
// growing season (times the year's weather); the predators' take y·p·x/(x + H)/(1 + c·y), which
// saturates in prey and is shared out among crowding predators (the damping); predators grow by
// e times what they take and die at m. Then both seep toward emptier neighbours.
function smallGameDay(world, sea) {
  const P = PARAMETERS.game, S = P.small, Q = P.pred, g = world.grid;
  const K = world.caps.smallgame, st = world.stock.smallgame, y = world.game.pred, act = world.active.smallgame;
  const r = S.r * sea.growth * world.game.weather;
  for (let j = 0; j < act.length; j++) {
    const i = act[j], k = K[i];
    let x = st[i] / k, q = y[i];
    const take = q * Q.p * x / (x + Q.H) / (1 + Q.c * q);
    const born = r * Math.max(x, S.floor) * (1 - x);
    x = Math.max(0, x + born - take);
    q = Math.max(Q.floor, q + q * (Q.e * Q.p * (x / (x + Q.H)) / (1 + Q.c * q) - Q.m));
    st[i] = x * k; y[i] = q;
  }
  // seeping: across each edge, a share of the difference in fullness (prey) or load (predator)
  for (let j = 0; j < act.length; j++) {
    const i = act[j];
    for (let d = 0; d < 3; d++) {   // each edge once
      const m = g.nbr[i * 6 + d];
      if (m < 0 || !(K[m] > 0)) continue;
      const kk = Math.min(K[i], K[m]);
      const f = S.seep * (st[i] / K[i] - st[m] / K[m]) * kk;
      st[i] -= f; st[m] += f;
      const fq = Q.seep * (y[i] - y[m]);
      y[i] -= fq; y[m] += fq;
    }
  }
}

// ── grazing ──────────────────────────────────────────────────────────────────────────────
// The grass part regrows in the growing season, browse under trees all year.
function grazeDay(world, sea) {
  const H = PARAMETERS.game.graze, z = world.game.graze;
  for (let j = 0; j < world.landHexes.length; j++) {
    const i = world.landHexes[j], cap = grazeCap(world, i);
    if (!(cap > 0)) { z[i] = 0; continue; }
    const share = H.grass * world.cover.grass[i] / (H.grass * world.cover.grass[i] + H.browse * world.cover.trees[i] + 1e-9);
    const r = H.r * (share * sea.growth + (1 - share) * H.browseAllYear);
    z[i] = Math.min(cap, z[i] + r * Math.max(z[i], 0.05 * cap) * (1 - z[i] / cap));
  }
}

// ── herds ────────────────────────────────────────────────────────────────────────────────
// Each day a herd takes up to `steps` steps, each to whichever of its hex and the neighbours
// scores best: how full the grazing is, water there or beside it, less the pack and people
// traces, plus a little chance. Then it grazes. Calves come in spring, as many as how well the
// herd has fed and the room left under the ceiling allow; animals die at a background rate,
// and of hunger when grazing runs short. A herd above `split` splits; one below 1 is gone.
function herdsDay(world, sea) {
  const P = PARAMETERS.game, B = P.herd, g = world.grid, G = world.game, rng = world.rng;
  const z = G.graze, tr = G.trace;
  let total = 0;
  for (const h of G.herds) total += h.n;
  const room = Math.max(0, 1 - total / B.ceiling);
  const score = (i) => {
    const cap = grazeCap(world, i);
    return (cap > 0 ? z[i] / cap : 0) + (world.waterAt[i] >= 0 ? B.water : 0)
      - B.avoidPack * tr.pack[i] - B.avoidPeople * tr.people[i] + B.wander * rng();
  };
  for (const h of G.herds) {
    for (let s = 0; s < B.steps; s++) {
      let best = h.hex, bs = score(h.hex);
      for (let d = 0; d < 6; d++) {
        const m = g.nbr[h.hex * 6 + d];
        if (m < 0 || world.hours[m] < 0 || !(world.land[m] > 0 || world.terrain[m] === T_RIVER)) continue;
        const sc = score(m);
        if (sc > bs) { bs = sc; best = m; }
      }
      if (best === h.hex) break;
      h.hex = best;
      leaveTrace(world, 'herd', h.hex, h.n / B.start);
    }
    leaveTrace(world, 'herd', h.hex, h.n / B.start);
    // grazing, and how well fed (a running share of the day's need met)
    const want = h.n, ate = Math.min(want, z[h.hex]);
    z[h.hex] -= ate;
    const fed = want > 0 ? ate / want : 1;
    h.fed += B.fedRate * (fed - h.fed);
    const born = B.birth * sea.growth * h.fed * room * h.n;
    const died = h.n * (B.die + B.starve * Math.max(0, 1 - h.fed));
    h.n = Math.max(0, h.n + born - died);
  }
  // splitting and dying out
  const out = [];
  for (const h of G.herds) {
    if (h.n < 1) continue;
    if (h.n > B.split) {
      const other = { hex: h.hex, n: h.n / 2, fed: h.fed };
      h.n /= 2;
      out.push(other);
    }
    out.push(h);
  }
  G.herds = out;
  // animals come in from beyond the map while there are fewer than `min` herds
  if (G.herds.length < B.min && rng() < B.arrive) G.herds.push({ hex: edgeHex(world), n: B.start / 2, fed: 1 });
}
// a land hex on the edge of the map, at random (where animals come in from beyond it)
function edgeHex(world) {
  const g = world.grid, rng = world.rng;
  for (let t = 0; t < 1000; t++) {
    const side = rng.int(4), k = side < 2 ? rng.int(g.W) : rng.int(g.H);
    const i = side === 0 ? k : side === 1 ? (g.H - 1) * g.W + k : side === 2 ? k * g.W : k * g.W + g.W - 1;
    if (world.land[i] > 0 && world.hours[i] >= 0) return i;
  }
  return world.landHexes[rng.int(world.landHexes.length)];
}

// ── packs ────────────────────────────────────────────────────────────────────────────────
// A pack on a herd's hex stays and hunts it. Otherwise it takes up to `steps` steps: toward
// the nearest herd within `sense` hexes (scent), else up the herd trace, else on in the way it
// was going (turning now and then), so it ranges instead of milling. Wolves are a control on
// the herds, not a competitor (Decided — Chris, 2026-11-12): a pack takes in proportion to the
// wolves and the animals there, whatever it needs (its need is met elsewhere when the herds
// can't), and wolf numbers drift toward a level set by all the herd animals on the map, times
// a yearly draw. A pack above `split` splits; one below 1 is gone.
function packsDay(world, sea) {
  const P = PARAMETERS.game, W = P.pack, g = world.grid, G = world.game, rng = world.rng;
  const herdAt = new Map();
  for (const h of G.herds) if (!herdAt.has(h.hex) || herdAt.get(h.hex).n < h.n) herdAt.set(h.hex, h);
  const tr = G.trace.herd, ok = (m) => m >= 0 && world.hours[m] >= 0;
  for (const p of G.packs) {
    if (p.dir == null) p.dir = rng.int(6);
    for (let s = 0; s < W.steps && !herdAt.has(p.hex); s++) {
      let best = -1;
      // scent: the nearest herd within `sense`, one step toward it
      let near = null, nd = Infinity;
      for (const h of G.herds) { const d = g.dist(p.hex, h.hex); if (d <= W.sense && d < nd) { nd = d; near = h; } }
      if (near) {
        let bd = Infinity;
        for (let d = 0; d < 6; d++) { const m = g.nbr[p.hex * 6 + d]; if (ok(m) && g.dist(m, near.hex) < bd) { bd = g.dist(m, near.hex); best = m; } }
      } else {
        // the trace, if there is one to climb
        let bs = tr[p.hex] + W.minTrace;
        for (let d = 0; d < 6; d++) { const m = g.nbr[p.hex * 6 + d]; if (ok(m) && tr[m] > bs) { bs = tr[m]; best = m; } }
        if (best < 0) {
          if (rng() < W.turn) p.dir = (p.dir + (rng() < 0.5 ? 1 : 5)) % 6;
          let m = g.nbr[p.hex * 6 + p.dir];
          for (let t = 0; t < 6 && !ok(m); t++) { p.dir = rng.int(6); m = g.nbr[p.hex * 6 + p.dir]; }
          if (ok(m)) best = m;
        }
      }
      if (best < 0) break;
      p.hex = best;
      leaveTrace(world, 'pack', p.hex, p.n / W.start);
    }
    leaveTrace(world, 'pack', p.hex, p.n / W.start);
    const h = herdAt.get(p.hex);
    if (h) {
      const ate = Math.min(h.n, W.take * p.n * h.n);
      h.n -= ate;
      G.kills.packs += ate;
    }
  }
  // wolf numbers drift toward one wolf per `perWolf` herd animals, times this year's draw
  let wolves = 0, animals = 0;
  for (const p of G.packs) wolves += p.n;
  for (const h of G.herds) animals += h.n;
  const target = animals / W.perWolf * (G.wolfYear || 1);
  const grow = wolves > 0 ? W.track * clamp(target / wolves - 1, -1, 1) : 0;
  for (const p of G.packs) p.n = Math.max(0, p.n * (1 + grow));
  const out = [];
  for (const p of G.packs) {
    if (p.n < 1) continue;
    if (p.n > W.split) { out.push({ hex: p.hex, n: p.n / 2 }); p.n /= 2; }
    out.push(p);
  }
  G.packs = out;
  if (G.packs.length < W.min && rng() < W.arrive) G.packs.push({ hex: edgeHex(world), n: W.start / 2 });
}
