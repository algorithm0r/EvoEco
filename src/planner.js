'use strict';
// Daily route planning (ODD §7.6, Chris's "noisy pathfinding"). Each morning an agent
// chooses a route — up to a few stops, each a hex and an activity with hours — that leaves
// its needs nearest their set points tonight and over the next few days, for the least cost.
//
// The score of a route is the convex need cost of tonight's evening, plus the discounted
// cost of the next `horizon` days living on what is left (the Keep value: food that rots
// covers fewer days, wood that keeps covers more, a lean-to keeps giving warmth), minus the
// curiosity bonus for looking at unseen hexes. Yields are the agent's own habit estimates,
// made optimistic by the curiosity term where it has little experience (ODD §4.4).
//
// Search (Default): rank every candidate stop by the score of a one-stop day and keep, for
// EACH ACTIVITY, the best few by gain and the best few by gain per hour of the day it takes
// (ranking all activities together let the most pressing need crowd every other activity off
// the shortlist; ranking by gain alone kept only far, full hexes). Then build the route
// greedily twice — add a stop at its best position, or give an existing stop another chunk of
// hours, while the score improves — once taking the move with the most gain, once the move
// with the most gain per hour it adds, and keep the better route. Each order alone fails:
// by gain, one far stop can fill the day first and nothing else fits (in 80 of 99 checked
// mornings an agent at zero water skipped a drink a better plan had, and agents died of
// thirst beside the water at home); by gain per hour, cheap poor work near home can fill the
// day so the good trip no longer fits. (2026-11-03.)

function planDay(agent, world) { return planBest(agent, world, true).plan; }

// The best route and its cost. Without `withTrade` the trade arm is left out throughout (the
// cheaper search that scores camp sites, ODD §5 Moving camp).
function planBest(agent, world, withTrade) {
  const A = PARAMETERS.agents;
  agent.costs = null;                     // hour costs as of this morning
  agent.hutV = hutValue(agent, world);   // worked out once a day (also used in the exchange)
  const half = Math.ceil(A.topPerActivity / 2);
  const cands = undominated(agent, world, planCandidates(agent, world), half);
  // candidates are ranked without the trade arm (five times cheaper; the route itself is
  // built and chosen with it)
  const base0 = planCost(agent, world, [], false);
  agent._hourValue = 0;
  for (const c of cands) {
    c.solo = planCost(agent, world, [c], false);
    c.rate = (base0 - c.solo) / planHours(agent, world, [c]);
    if (c.rate > agent._hourValue && c.rate < Infinity) agent._hourValue = c.rate;
  }
  const top = [];
  for (const key of ['solo', 'rate']) {
    const kept = ACT_NAMES.map(() => 0);
    const sorted = cands.slice().sort(key === 'solo' ? (a, b) => a.solo - b.solo : (a, b) => b.rate - a.rate);
    for (const c of sorted) {
      if (!(c.solo < base0) || kept[c.act] >= half) continue;
      if (top.indexOf(c) < 0) top.push(c);
      kept[c.act]++;
    }
  }
  const base = planCost(agent, world, [], withTrade);
  const byGain = greedyRoute(agent, world, top, base, false, withTrade);
  const byRate = greedyRoute(agent, world, top, base, true, withTrade);
  const best = byRate.cost < byGain.cost ? byRate : byGain;
  // a night out (ODD §5 multi-day trips) is weighed once the day's route is built: the route
  // as it is if it ends in a hunt, and the route with each hunting stop it weighs added at its
  // end, also as a whole day of hunting (weighing it inside the search doubled the planner's
  // cost). Not for a camp site
  // being scored (siteDay: the day is scored as if it starts and ends there).
  if (!withTrade) return best;
  const tries = [];
  if (best.plan.length && best.plan[best.plan.length - 1].act === A_HUNT) tries.push(best.plan.slice());
  if (best.plan.length < A.maxStops) {
    for (const c of cands) if (c.act === A_HUNT && !best.plan.some((s) => s.hex === c.hex && s.act === A_HUNT)) tries.push(best.plan.concat([c]));
  }
  for (const c of cands) if (c.act === A_HUNT) tries.push([c, Object.assign({}, c, { hours: 2 * A.chunk })].slice(1));
  // and with a drink on the way, at the nearest water it weighs, when the route has none
  const drink = cands.filter((c) => c.act === A_DRINK).sort((x, y) => world.travel(startHex(agent))[x.hex] - world.travel(startHex(agent))[y.hex])[0];
  if (drink) for (const p of tries.slice()) if (!p.some((s) => s.act === A_DRINK) && p.length < A.maxStops) tries.push([drink].concat(p));
  // scored without the trade arm (five times cheaper), against the route home scored the same way
  let bar = tries.length ? planCost(agent, world, best.plan, false) : Infinity, pick = null;
  for (const p of tries) {
    const c = outCost(agent, world, p, false);
    if (c < bar) { bar = c; pick = p; }
  }
  if (pick) { pick.out = true; best.plan = pick; best.cost = outCost(agent, world, pick, withTrade); }
  return best;
}

// The shortlist keeps, per activity, the best `half` stops by one-stop cost and the best
// `half` by gain per hour. For gathering and drinking, a one-stop day differs between stops
// of one activity only in what it brings in and the round trip, and costs less with more
// brought in and fewer hours; so a stop that `half` others match or beat on both can make
// neither list, and is dropped before the costly scoring. A speed-up only: the shortlist is
// unchanged (Stage 6, 2026-11-06: ranking was most of the planner's and camp weighing's time).
function undominated(agent, world, cands, half) {
  const fromHome = world.travel(startHex(agent)), groups = new Map();
  cands.forEach((c, i) => {
    c._keep = true;
    if (!IS_GATHER[c.act] && c.act !== A_DRINK) return;
    c._i = i;
    c._amt = c.act === A_DRINK ? 0 : planEstimate(agent, c.hex, c.act, world.day, world);
    c._trip = fromHome[c.hex] + world.travel(c.hex)[agent.home];
    let g = groups.get(c.act);
    if (!g) groups.set(c.act, (g = []));
    g.push(c);
  });
  for (const g of groups.values()) {
    g.sort((x, y) => x._trip - y._trip || y._amt - x._amt || x._i - y._i);
    const best = [];   // the `half` largest amounts among stops as near or nearer
    for (const c of g) {
      if (best.length >= half && !(c._amt > best[half - 1])) { c._keep = false; continue; }
      best.push(c._amt);
      best.sort((x, y) => y - x);
      if (best.length > half) best.length = half;
    }
  }
  return cands.filter((c) => c._keep);   // in their first order, so ties fall as before
}

// One greedy build of the route from the shortlist: each step takes the improving move with
// the most gain (perHour false) or the most gain per hour of the day it adds (perHour true).
function greedyRoute(agent, world, top, base, perHour, withTrade) {
  const A = PARAMETERS.agents;
  let plan = [], cost = base, hours = 0;
  for (let step = 0; step < A.maxGreedySteps; step++) {
    let bestPlan = null, bestCost = cost, bestScore = 0, bestHours = hours;
    const consider = (p2) => {
      const c = planCost(agent, world, p2, withTrade);
      if (!(c < cost)) return;
      const h2 = perHour ? planHours(agent, world, p2) : 0;
      const score = perHour ? (cost - c) / Math.max(0.25, h2 - hours) : cost - c;
      if (score > bestScore) { bestScore = score; bestPlan = p2; bestCost = c; bestHours = h2; }
    };
    for (let k = 0; k < plan.length; k++) {
      const s = plan[k];
      if (s.act === A_DRINK || s.act === A_SCOUT || s.act === A_CRAFT || s.act === A_TINKER || s.act === A_FETCH) continue;   // fixed-length stops
      if (s.act === A_PROCESS && !(agent.hold[PROCESSES[s.process].from] > PROCESSES[s.process].perHour * s.hours)) continue;   // nothing more to process
      const p2 = plan.slice();
      p2[k] = Object.assign({}, s, { hours: s.hours + A.chunk });
      consider(p2);
    }
    if (plan.length < A.maxStops) {
      for (const cd of top) {
        if (plan.some((s) => s.hex === cd.hex && s.act === cd.act)) continue;
        for (let pos = 0; pos <= plan.length; pos++) {
          const p2 = plan.slice();
          p2.splice(pos, 0, cd);
          consider(p2);
        }
      }
    }
    if (!bestPlan) break;
    plan = bestPlan; cost = bestCost; hours = bestHours;
  }
  return { plan, cost };
}

// The cost of the agent's best day were its home at `hex`, after a morning's walk of `walk`
// hours to get there (ODD §5 Moving camp: each member scores a site by its own planning
// cost there). At a new site it would take the best empty dwelling there, if any (its own is
// left behind), and fields beyond a half day's reach of it bring nothing back
// (pendingGrain). With `n` campers there, the land it saw is expected to thin over the week
// by its learned thinning per camper (ODD §5 Crowding enters the forecast); the mean over the
// week is half the week's thinning. Where the best free dwelling is less warm than its own, it
// is assumed to rebuild its own, the hours charged to the forecast's first week; and for the
// rest of the season it gathers by how full it has seen the site's land against its usual
// (ODD §5 A site's forecast prices rebuilding and its own land). The agent is restored after.
function siteDay(agent, world, hex, walk, n) {
  const keep = { home: agent.home, shelter: agent.shelter, drinkTrip: agent.drinkTrip,
    farmFert: agent.farmFert, hutV: agent.hutV, walked: agent.walked, at: agent.at, hold: agent.hold };
  agent.at = -1;   // a site is scored as if the day starts there
  agent.walked = 0;
  agent.walked = Math.min(walk, agent.capacity());
  agent.crowd = n && agent.thin ? 0.5 * n * Math.max(0, agent.thin[world.seasonIndex].v) : 0;
  let fetched = null;
  if (hex !== agent.home) {
    const [carried, left] = movingLoad(agent, agent.hold);   // what it carries there (ODD §2 carrying)
    agent.hold = carried;
    fetched = fetchTrips(agent, world, hex, carried, left);
    const own = agent.shelter;
    agent.settle(world, hex);
    const d = world.dwellings && world.bestDwelling(hex, agent);
    agent.shelter = d || newShelter(hex);
    if (!(d && shelterIns(d) >= shelterIns(own))) {
      const r = rebuildAt(agent, world, own, hex);
      if (r && shelterIns(r.shelter) > shelterIns(agent.shelter)) { agent.shelter = r.shelter; agent.rebuild = r.hours; }
    }
  }
  agent.landRatio = landRatio(agent, world, hex);
  let cost = planBest(agent, world, false).cost;
  // or with trips back for the rest: the better of fetching it and leaving it
  if (fetched) {
    agent.hold = fetched.hold; agent.fetchWork = fetched.hours;
    cost = Math.min(cost, planBest(agent, world, false).cost);
    agent.fetchWork = 0;
  }
  Object.assign(agent, keep);
  agent.costs = null;
  agent.crowd = 0; agent.landRatio = 1; agent.rebuild = 0;
  return cost;
}

// Moving camp in more than one trip (ODD §2 Fetching is moving camp in more than one trip,
// Decided — Chris, 2026-11-13): from a site at `hex`, a trip a day back to the old camp for what
// it could not carry, each taking up what it can (fetchLoad), while trips bring something, up to
// the days until the camp weighs moving again, and only if a round trip fits in a day. Returns
// the holding with everything fetched and the trips' hours (charged to the forecast's first
// week, as rebuilding is), or null. What rots meanwhile, the projection rots.
function fetchTrips(agent, world, hex, carried, left) {
  const trip = 2 * world.travel(hex)[agent.home] + PARAMETERS.carry.fetchHours;
  if (!(trip <= agent.capacity())) return null;
  const hold = { ...carried };
  let rest = left, k = 0;
  while (k < PARAMETERS.camp.every - 1) {
    const [taken, r] = fetchLoad(agent, rest, carried);
    let kg = 0;
    for (const g in taken) kg += taken[g] * goodKg(g);
    if (!(kg > 1e-6)) break;
    for (const g in taken) if (taken[g] > 0) hold[g] += taken[g];
    rest = r; k++;
  }
  return k ? { hold, hours: k * trip } : null;
}

// What an agent expects still lies at `hex`: what it saw there, food rotted since (World.noteGoods).
// Null (and forgotten) when nothing would be left.
function goodsExpected(agent, world, hex) {
  const s = agent.goodsSeen && agent.goodsSeen.get(hex);
  if (!s) return null;
  const L = { ...s.hold }, d = world.day - s.day;
  for (const g of FOODS) if (L[g] > 0) { L[g] *= Math.pow(1 - PARAMETERS.goods[g].rot, d); if (L[g] < 1e-3) L[g] = 0; }
  L.water = 0;
  for (const g in L) if (L[g] > 1e-6) return L;
  agent.goodsSeen.delete(hex);
  return null;
}

// The agent's own shelter put up again at `hex`, and the hours it takes it: the build's hours
// (fewer with an axe) and its inputs at its hour costs there, times how complete its shelter
// is, shared among those sleeping in it now. A hut only if it knows how and can get the
// inputs; else its lean-to, if it has one. Null if neither.
function rebuildAt(agent, world, own, hex) {
  const c = hourCosts(agent, world), sharers = Math.max(1, own.sleepers.length);
  const hours = (B, done) => {
    let T = B.hours / (B.tool && agent.hold[B.tool] > 0 ? TOOLS[B.tool].mult : 1);
    for (const g in B.inputs) T += B.inputs[g] * c[g];
    return T * done / sharers;
  };
  if (own.hutDone && own.hut > 0 && agent.knows.has('hut')) {
    const T = hours(BUILDS.hut, own.hut);
    if (T < Infinity) return { shelter: Object.assign(newShelter(hex), { hut: own.hut, hutDone: true }), hours: T };
  }
  if (own.leanTo > 0 && agent.knows.has('leanTo')) {
    const T = hours(BUILDS.leanTo, own.leanTo);
    if (T < Infinity) return { shelter: Object.assign(newShelter(hex), { leanTo: own.leanTo }), hours: T };
  }
  return null;
}

// How full the agent has seen a site's land, less the thinning expected there, against how full
// the land around camp usually is this season; 1 until it has learned the usual.
function landRatio(agent, world, hex) {
  const L = agent.livedLand && agent.livedLand[world.seasonIndex];
  if (!L || (L.nh === 0 && L.nn === 0) || !(L.v > 0.01)) return 1;
  return world.landAround(agent, hex, agent.crowd) / L.v;
}

// How full the agent expects a hex to be for an activity: as last seen, less the thinning
// expected while a camp site is scored (siteDay; food and wood only).
function seenLand(agent, act, h) {
  const f = agent.seenFrac[act][h];
  return agent.crowd > 0 && (IS_FORAGE[act] || act === A_WOOD) ? Math.max(0, f - agent.crowd) : f;
}

// Hours a route takes: travel between its stops and back home, and the work at each.
function planHours(agent, world, plan) {
  const start = startHex(agent);
  let at = start, h = 0;
  for (const s of plan) { h += world.travel(at)[s.hex] + s.hours; at = s.hex; }
  if (plan.out) return h;
  return plan.length || start !== agent.home ? h + world.travel(at)[agent.home] : 0;
}
// where the agent's day starts: camp, or where it slept out (ODD §5 multi-day trips)
function startHex(agent) { return agent.at >= 0 ? agent.at : agent.home; }

// Everything the agent could do today: gather (wild food in its season, Stage 5g) or drink at
// known hexes within reach, build, make or process what it knows at home, tinker, or walk to
// an unseen hex to look.
function planCandidates(agent, world) {
  const A = PARAMETERS.agents;
  const reach = agent.capacity() / 2;
  // waking out, it need not come back to where it starts: water it knows within the whole day's
  // hours is somewhere to drink (and, stranded, to sleep) (ODD §5 multi-day trips)
  const drinkReach = agent.at >= 0 ? agent.capacity() - A.drinkHours : reach;
  const fromHome = world.travel(startHex(agent));
  const out = [], unseen = [], tinkerAt = [], fields = [];
  const sowing = agent.knows.has('farm') && agent.hold.grain > 0 && world.season().phase < 0.25;
  const forage = FORAGE.filter((k) => world.inSeason(ACT_RES[k]));
  for (let h = 0; h < world.grid.n; h++) {
    if (!(fromHome[h] <= reach)) {
      if (fromHome[h] <= drinkReach && agent.known[h] && world.waterAt[h] >= 0) out.push({ hex: h, act: A_DRINK, hours: A.drinkHours, unknown: 0 });
      continue;
    }
    if (!agent.known[h]) { unseen.push(h); continue; }
    if (world.land[h] > 0) {
      for (const k of forage) out.push({ hex: h, act: k, hours: A.chunk, unknown: 0 });
      out.push({ hex: h, act: A_WOOD, hours: A.chunk, unknown: 0 });
    }
    if (world.waterAt[h] >= 0) out.push({ hex: h, act: A_DRINK, hours: A.drinkHours, unknown: 0 });
    if (world.caps.flint[h] > 0) out.push({ hex: h, act: A_QUARRY, hours: A.chunk, unknown: 0 });
    // the first material tree (Stage 5h): gourd fruit in its season, fibre
    if (world.caps.gourds && world.caps.gourds[h] > 0 && world.inSeason('gourds')) out.push({ hex: h, act: A_GOURD, hours: A.chunk, unknown: 0 });
    if (world.caps.fibre && world.caps.fibre[h] > 0) out.push({ hex: h, act: A_FIBRE, hours: A.chunk, unknown: 0 });
    if (world.caps.clay[h] > 0) out.push({ hex: h, act: A_DIG, hours: A.chunk, unknown: 0 });
    // farming (Stage 5d): ripe grain seen standing in a field; land to sow in spring
    if (agent.seenGrain[h] > 0.5) out.push({ hex: h, act: A_REAP, hours: A.chunk, unknown: 0 });
    if (sowing && world.canFarm(h)) fields.push(h);
    // places with stone or clay to work with (ODD §7.3: tinkering works with what is at hand)
    if (h !== agent.home && (agent.seenFrac[A_DIG][h] > 0.02 || agent.seenFrac[A_QUARRY][h] > 0.02)) tinkerAt.push(h);
  }
  // build or repair at home what it knows how to build (ODD §7.6: a hut over several days)
  for (const b in BUILDS) {
    if (agent.knows.has(b) && agent.shelter[b] < 1) out.push({ hex: agent.home, act: A_BUILD, build: b, hours: A.chunk, unknown: 0 });
  }
  // make a good at home, for each recipe it knows (ODD §5, §7.3)
  for (const r in RECIPES) {
    if (agent.knows.has(r)) out.push({ hex: agent.home, act: A_CRAFT, recipe: r, hours: RECIPES[r].hours, unknown: 0 });
  }
  // process a food it holds, for each process it knows (Stage 5g)
  for (const p in PROCESSES) {
    if (agent.knows.has(processKnow(p)) && agent.hold[PROCESSES[p].from] > 0) out.push({ hex: agent.home, act: A_PROCESS, process: p, hours: 1, unknown: 0 });
  }
  // sow on the most fertile land within reach, nearer first among equals
  fields.sort((a, b) => world.fertility(b) / (1 + fromHome[b]) - world.fertility(a) / (1 + fromHome[a]));
  for (const h of fields.slice(0, A.sowCandidates)) out.push({ hex: h, act: A_SOW, hours: A.chunk, unknown: 0 });
  // tinker at home, or at the nearest places with stone or clay
  tinkerAt.sort((a, b) => fromHome[a] - fromHome[b]);
  for (const h of [agent.home].concat(tinkerAt.slice(0, A.tinkerCandidates))) {
    out.push({ hex: h, act: A_TINKER, hours: A.tinkerHours, unknown: 0 });
  }
  // snares (the hunting ladder): the places it weighs are its own snares longest untended
  // (most set, longest since) and the fullest small game for the walk, `candidates` in all
  if (agent.knows.has('snare')) {
    const sn = [], mine = new Set();
    if (agent.snaresAt) for (const [h, t] of agent.snaresAt) {
      if (fromHome[h] <= reach) { mine.add(h); sn.push({ h, k: 1e6 + t.n * (world.day - t.last) }); }
    }
    for (let h = 0; h < world.grid.n; h++) {
      if (mine.has(h) || !agent.known[h] || !(fromHome[h] <= reach) || !(agent.seenFrac[A_SMALL][h] > 0.05)) continue;
      sn.push({ h, k: agent.seenFrac[A_SMALL][h] / (1 + fromHome[h]) });
    }
    sn.sort((a, b) => b.k - a.k);
    for (const x of sn.slice(0, PARAMETERS.snare.candidates)) out.push({ hex: x.h, act: A_SNARE, hours: 1, unknown: 0 });
  }
  // hunting big game (ODD §2 Game, Stage 5h): the hexes where it expects the most sign for the
  // walk there
  if (agent.herdH) {
    const hunt = [];
    for (let h = 0; h < world.grid.n; h++) {
      if (!agent.known[h] || !(fromHome[h] <= reach) || world.hours[h] < 0) continue;
      const e = herdExpect(agent, world, h);
      if (e > 0.02) hunt.push({ h, e, k: e / (1 + fromHome[h]) });
    }
    hunt.sort((a, b) => b.k - a.k);
    for (const x of hunt.slice(0, PARAMETERS.hunt.candidates)) out.push({ hex: x.h, act: A_HUNT, hours: A.chunk, unknown: 0, sign: x.e });
  }
  // goods it knows lie within reach: a stop to take them up (ODD §2 Fetching is moving camp in
  // more than one trip, Decided — Chris, 2026-11-13)
  if (agent.goodsSeen) for (const [h] of agent.goodsSeen) {
    if (h !== agent.home && fromHome[h] <= reach && goodsExpected(agent, world, h)) out.push({ hex: h, act: A_FETCH, hours: PARAMETERS.carry.fetchHours, unknown: 0 });
  }
  // scouting: the nearest unseen hexes, each valued by how much it would reveal
  unseen.sort((a, b) => fromHome[a] - fromHome[b]);
  for (const h of unseen.slice(0, A.scoutCandidates)) {
    let u = 0;
    for (const m of world.grid.within(h, 1)) if (!agent.known[m]) u++;
    out.push({ hex: h, act: A_SCOUT, hours: A.scoutHours, unknown: u });
  }
  return out;
}

// Expected yield per hour of an activity at a hex: the agent's learned rate from a full hex
// times how full the hex looked when it last saw it. An old sighting is uncertain (the hex
// may have regrown or been stripped), and the curiosity term makes that uncertainty
// optimistic, so stale hexes get looked at again (ODD §4.4).
function planEstimate(agent, hex, act, day, world) {
  const A = PARAMETERS.agents;
  if (act === A_HUNT) return huntEstimate(agent, hex, world);
  if (act === A_SNARE) return agent.rate(A_SNARE) * workRate(agent) * Math.min(1, seenLand(agent, A_SMALL, hex));
  const frac = seenLand(agent, act, hex);
  const sd = A.sightSd * (1 - Math.exp(-(day - agent.seenDay[hex]) / A.sightMemory));
  const tool = TOOL_FOR[act], mult = tool && agent.hold[tool] > 0 ? TOOLS[tool].mult : 1;
  return agent.rate(act) * mult * workRate(agent) * Math.min(1, frac + A.curiosity * sd);
}

// The cost of a route home for the night; or, for an agent too far out to reach camp today,
// with the night where the route ends (ODD §5 multi-day trips: stranded out, it still plans)
function planCost(agent, world, plan, withTrade) {
  if (agent.at >= 0 && !(world.travel(agent.at)[agent.home] <= agent.capacity())) {
    plan.out = true;
    return routeCost(agent, world, plan, withTrade, true);
  }
  return routeCost(agent, world, plan, withTrade, false);
}
// The cost of a route that ends in a hunt with the night out where the hunt ends (ODD §5
// multi-day trips: where to sleep is part of the morning plan, Decided — Chris, 2026-11-11).
function outCost(agent, world, plan, withTrade) {
  const last = plan[plan.length - 1];
  if (!last || last.act !== A_HUNT || agent.child) return Infinity;
  plan.out = true;
  return routeCost(agent, world, plan, withTrade, true);
}
function routeCost(agent, world, plan, withTrade, sleepOut) {
  const A = PARAMETERS.agents, G = PARAMETERS.goods;
  const cap = agent.capacity();
  const start = startHex(agent);
  let at = start, hours = 0, bonus = 0;
  // what it carries (ODD §2 Containers and carrying): out, all it has with it; leaving camp for
  // a night out, the pack it would take (the rest stays where it sleeps); else its vessels' water
  let hold = { ...agent.hold }, store = agent.store;
  if (sleepOut && !store) { const [p, s] = packOut(agent, hold); hold = p; store = s; }
  const c = store ? carriedOf(hold) : newCarried();
  if (!store) carryAdd(c, 'water', Math.min(hold.water, vesselCap(hold)));
  const kidKg = childKg(agent);
  let kgHours = 0;
  const shelter = Object.assign({}, agent.shelter);
  let drank = false;
  const lying = new Map();   // what it expects still lies at each stop, as it takes up
  for (const s of plan) {
    const leg = world.travel(at)[s.hex];
    hours += leg;
    kgHours += (c.kg + kidKg) * leg;
    at = s.hex;
    if (IS_GATHER[s.act] || s.act === A_HUNT || s.act === A_SNARE) {
      const est = planEstimate(agent, s.hex, s.act, world.day, world);
      const tool = s.act === A_HUNT ? huntTool(hold) : TOOL_FOR[s.act];
      if (tool && hold[tool] > 0) hold[tool] = Math.max(0, hold[tool] - s.hours / TOOLS[tool].life);
      // what it can carry of it, and eat there
      const g = GOOD_OF[s.act], room = carryRoom(agent, hold, c, g);
      const q = Math.min(est * s.hours, room + (FOOD_SET[g] ? eatRoom(agent, g) : 0));
      hold[g] += q; carryAdd(c, g, Math.min(q, room));
    } else if (s.act === A_DRINK) {
      drank = true;
      if (s.hex === agent.home && !store) hold.water = Math.max(hold.water, waterCarried(hold));
      else { const add = Math.max(0, Math.min(vesselCap(hold) - c.water / goodKg('water'), carryRoom(agent, hold, c, 'water'))); hold.water += add; carryAdd(c, 'water', add); }
    }
    else if (s.act === A_PROCESS) {
      if (!(processFood(hold, s.process, s.hours) > 0)) return Infinity;   // nothing to process
    }
    else if (s.act === A_BUILD) {
      if (!(buildWork(shelter, hold, s.build, s.hours) > 0)) return Infinity;   // nothing to work with
    } else if (s.act === A_CRAFT) {
      const R = RECIPES[s.recipe];
      if (!Object.keys(R.inputs).every((g) => hold[g] >= R.inputs[g])) return Infinity;
      for (const g in R.inputs) hold[g] -= R.inputs[g];
      hold[s.recipe] += 1;
    } else if (s.act === A_SOW) {
      // what it sows comes back at harvest at its learned return (projected in keepCost)
      const seeds = Math.min(hold.grain, s.hours * G.grain.sowPerHour * (hold.hoe > 0 ? TOOLS.hoe.mult : 1),
        world.sowRoom(s.hex) / PARAMETERS.land.landPerSeed);
      if (!(seeds > 1e-6)) return Infinity;
      hold.grain -= seeds;
      hold.sown = (hold.sown || 0) + seeds * world.fertility(s.hex) * agent.farmReturn;
    } else if (s.act === A_REAP) {
      hold.grain += Math.min(agent.seenGrain[s.hex], s.hours * G.grain.reapPerHour * (hold.sickle > 0 ? TOOLS.sickle.mult : 1));
    } else if (s.act === A_SCOUT) bonus += A.scoutValue * s.unknown;
    else if (s.act === A_TINKER) bonus += tinkerBonus(agent, world, hold, s.hex, s.hours);
    hours += s.hours;
    // goods it knows lie here: it takes up what it can carry (ODD §2 Fetching is moving camp in
    // more than one trip; World.pickUp)
    if (agent.goodsSeen && (s.hex !== agent.home || store)) {
      const L = lying.get(s.hex) || goodsExpected(agent, world, s.hex);
      if (L) { takeLying(agent, hold, c, L); lying.set(s.hex, L); }
    }
  }
  if (!sleepOut && (plan.length || start !== agent.home)) { const h = world.travel(at)[agent.home]; hours += h; kgHours += (c.kg + kidKg) * h; }
  if (!(hours <= cap)) return Infinity;
  agent._carryFood = PARAMETERS.carry.burn * kgHours;
  // home tonight: what it carried joins what stayed where it sleeps
  if (!sleepOut && store) for (const g in store) hold[g] += store[g];
  // the risk of the day (ODD §2 Game: risk is learned and priced): its learned rate of injury
  // in each setting, times the hours in it, times what an injury is expected to cost
  if (agent.injL && plan.length) {
    let risk = 0, worked = 0;
    for (const s of plan) {
      worked += s.hours;
      if (s.act === A_HUNT) risk += s.hours * agent.injL.hunt.v;
      else if (s.act === A_BUILD) risk += s.hours * agent.injL.build.v;
      else if (s.hex !== agent.home) risk += s.hours * agent.injL.out.v;
    }
    risk += (hours - worked) * agent.injL.out.v;   // the walking
    // priced where it sleeps tonight: camp, or out where the route ends
    const night = !sleepOut ? agent.home : plan[plan.length - 1].hex;
    bonus -= risk * injuryCost(agent, world, night);
  }
  // what ties at camp announced this morning, as it expects it to come back tonight (ODD §7.6);
  // none of it reaches a night out
  if (agent.incoming && !sleepOut) for (const g in agent.incoming) hold[g] += agent.incoming[g];
  if (sleepOut) {
    // a night out: no shelter tonight, and tonight's walk home is put off, not saved. Tomorrow,
    // with the chance p that game is still there, it hunts on without the walk out (W hours
    // saved); else it first walks home (W hours spent). So tomorrow gains (2p - 1)·W hours, at
    // what an hour is worth to it today (the best gain per hour of this morning's stops), a day on
    const last = plan.length ? plan[plan.length - 1] : { hex: start };   // no stops: the night where it is
    let sign = 0;
    for (const m of world.grid.within(last.hex, 1)) sign = Math.max(sign, herdExpect(agent, world, m));
    const hv = PARAMETERS.agents.discount * (agent._hourValue || 0);
    const walk = Math.min(world.travel(agent.home)[last.hex], agent.capacity());   // beyond a day's walk: a day
    bonus += hv * walk * (2 * Math.min(1, sign) - 1);
    // tomorrow's water: the walk from there to the nearest water it knows, instead of camp's
    // trip; none it knows within half a day is a day of thirst (the projection assumes water
    // is drunk, so a night out has to price it)
    const wt = knownWaterFrom(agent, world, last.hex);
    bonus -= wt <= agent.capacity() / 2 ? hv * Math.max(0, 2 * wt - agent.drinkTrip) : WORST_NEED_COST;
    // belonging tonight only from those it expects out with it: campmates who have planned a
    // night out within a hex of it this morning (ODD §5 multi-day trips)
    const near = [];
    for (const b of campMates(agent, world)) {
      if (b === agent || !b.announced || !b.plan || !b.plan.out) continue;
      const bl = b.plan.length ? b.plan[b.plan.length - 1].hex : b.at;   // no stops: where it is
      if (bl >= 0 && world.grid.dist(bl, last.hex) <= 1) near.push(b);
    }
    agent._outBelong = agent.belongingWith(near, world.day);
    agent._outTonight = true;
    agent._storeTonight = store;   // back at camp after tonight (keepCost's weeks ahead)
    const cost = holdingsCost(agent, world, hold, shelter, hours, drank, agent.need.belonging, withTrade !== false) - bonus;
    agent._outTonight = false; agent._storeTonight = null; agent._carryFood = 0;
    return cost;
  }
  const cost = holdingsCost(agent, world, hold, shelter, hours, drank, agent.need.belonging, withTrade !== false) - bonus;
  agent._carryFood = 0;
  return cost;
}

// The cost of ending the day with `hold`: tonight's evening plus the Keep projection. With
// `withTrade`, the Trade arm too (ODD §7.6 best of keep / trade / give; trade enters the
// plan): part of one good may be swapped for the other at the going rate, discounted by how
// reliably the agent's trades have come off, and the cheaper outcome counts. The pair is its
// main food (the most food in hand) and wood (Stage 5g: one pair keeps the arm cheap). (Give
// is decided in the exchange phase, where the recipient's need is known; exchange.js.)
function holdingsCost(agent, world, hold, shelter, busy, drank, belonging, withTrade) {
  const keep = (h) => keepCost(agent, world, h, shelter, busy, drank, belonging) - projectValue(agent, world, h, shelter);
  let best = keep(hold);
  if (!withTrade || !(agent.tradeRel > 0.01)) return best;
  let fd = null, most = 0;
  for (const k of FOODS) { const v = hold[k] * PARAMETERS.goods[k].restores; if (v > most) { most = v; fd = k; } }
  const P = agent.price[(fd || FOODS[0]) + '|wood'];
  if (!P) return best;
  const p = Math.exp(P.logp), rel = agent.tradeRel;   // p: units of its main food per unit of wood
  for (const f of [0.25, 0.5]) {
    if (fd) {
      const give = f * hold[fd];
      const c = keep(({ ...hold, [fd]: hold[fd] - rel * give, wood: hold.wood + rel * give / p }));
      if (c < best) best = c;
    }
    if (hold.wood > 0 && fd) {
      const give = f * hold.wood;
      const c = keep(({ ...hold, [fd]: hold[fd] + rel * give * p, wood: hold.wood - rel * give }));
      if (c < best) best = c;
    }
  }
  return best;
}

// Tonight's evening, then the Keep arm: the coming months on what is left (a good is valued
// over its storage life), with each week brought in as the agent has lived that season
// (what it gathered and what it netted in exchange), so a store is worth what it covers beyond
// that (winter). (Until 2026-11-03 the projection assumed 3 hours of foraging a day at the
// learned yield: about twice the food agents actually brought in, so stores looked cheap.) Projected in steps of
// `keepStep` days, each step's cost counted for every day in it. Belonging is held at
// tonight's level through the projection.
//
// The projected day is the agent's usual working day for the season (learned), plus its trips
// to water (fewer with a pot to store water in), so goods that save hours are worth the rest
// they free. With the inputs in hand, the agent is assumed to make the goods it knows whose
// use the projection models (`keep` recipes: the axe, the pot). An unfinished hut gives no
// warmth here; its worth is projectValue's.
function keepCost(agent, world, hold, shelter, busy, drank, belonging) {
  const A = PARAMETERS.agents, G = PARAMETERS.goods, N = PARAMETERS.needs;
  const cap = agent.capacity();
  const tab = projectionTable(world);
  const fs = foodScale(agent);   // a child's or a mother's food need (life.js), held through the projection
  const e = Agent.evening(agent.need, hold, agent._outTonight ? 0 : shelterIns(shelter), busy, drank, tab.coldNow, cap, 1, fs, agent._carryFood);
  // out tonight: what stayed where it sleeps is there again for the weeks ahead
  if (agent._storeTonight) for (const g in agent._storeTonight) e.hold[g] = (e.hold[g] || 0) + agent._storeTonight[g];
  let cost = needCost(e, true, agent._outTonight ? agent._outBelong : belonging, agent.coldDays);
  // a night that kills is the worst case of every need, tonight and on every day it takes
  // away (ODD §2 Needs: below zero the scale runs to death; a dead agent has nothing)
  if (e.food <= -needReserve('food') || e.water <= -needReserve('water') ||
      (e.warmth <= 0 && agent.coldDays + 1 > A.deathDays.warmth)) {
    let lost = 0;
    for (const T of tab) lost += T.beta * T.len;
    return cost + lost * WORST_NEED_COST;
  }
  // the weeks ahead, as plain numbers (this loop is most of the model's run time): the evening
  // of Agent.evening for a lumped week with water drunk, inlined
  const sq = (x) => (1 - x) * (1 - x), cold = (T) => T.cold;
  const h = e.hold;   // a fresh object from Agent.evening, changed in place
  let nf = e.food;
  let lean = shelter.leanTo, hut = shelter.hut, hutDone = shelter.hutDone;
  // grain it expects back at harvest: fields sown earlier and any sown today (Stage 5d)
  const arriving = agent.pendingGrain(world) + (hold.sown || 0);
  const farming = agent.knows.has('farm') && agent.farmFert > 0;
  // hours to rebuild at a site being scored fall in the first step (siteDay)
  let projSown = 0, ripened = false, carryWork = (agent.rebuild || 0) + (agent.fetchWork || 0);
  // gathering this season scaled by the site's land against the usual (siteDay)
  const ratio = agent.landRatio, si0 = tab.length ? tab[0].si : -1;
  let thisSeason = ratio !== 1;
  const rateWood = Math.max(0.1, agent.rate(A_WOOD));
  const keeps = KEEP_RECIPES.filter(([r]) => agent.knows.has(r));
  const capAhead = cap + agent.walked;   // a walk moving camp shortens today only
  const belongCost = sq(belonging), RF = needReserve('food'), NF = FOODS.length;
  let waterDays = (h.water || 0) / N.waterDecay;   // days of drinking the water held covers
  // the foods as plain numbers (Stage 5g): amounts, and each season's daily inflow
  const fq = FQ_SCRATCH, inflow = foodInflows(agent, world);
  for (let q = 0; q < NF; q++) fq[q] = h[FOODS[q]];
  for (let k = 0; k < tab.length; k++) {
    const T = tab[k], S = T.len, si = T.si;
    // gourd fruit kept dries within the step (ODD §2 carrying: weeks)
    if (h.gourdFruit > 0) { h.driedGourd += h.gourdFruit; h.gourdFruit = 0; }
    for (const [r, ins] of keeps) {
      if (h[r] > 0) continue;
      if (ins.every(([g, q]) => h[g] >= q)) {
        for (const [g, q] of ins) h[g] -= q;
        h[r] = 1;
      }
    }
    // the axe speeds the projected wood-cutting while it lasts
    const wMult = h.axe > 0 ? TOOLS.axe.mult : 1;
    const Fg = agent.flow[si].game, wt = huntTool(h), sp = Fg && Fg.v > 0 && wt ? Fg.v : 0;
    // a step as the agent has lived this season: what it brings in by gathering and nets in
    // exchange (ODD §7.6: expected future need from seasonal norms)
    const F = agent.flow[si];
    if (h.axe > 0) h.axe = Math.max(0, h.axe - S * F.wood.v / rateWood / TOOLS.axe.life);
    // each food rots at its own rate, and what the season brings in is added (Stage 5g)
    const rot = T.rot, inf = inflow[si];
    if (thisSeason && si !== si0) thisSeason = false;
    const lr = thisSeason ? ratio - 1 : 0;   // extra share of what it gathers
    // carrying gear (ODD §2 Gear is a strategy whose efficiency is learned, Decided — Chris,
    // 2026-11-13): the same food in fewer hours, the hours it gathers a day scaled by its learned
    // return bare-handed over its return with the gear. With nothing yet learned of the gear (no
    // day of its own with it, nothing told), its guess is its own shortfall: what its hands could
    // not hold, brought home (a basket or bag loose food, a bag bulky goods)
    const gs = carryGear(h), Rg = gs !== 'bare' ? F['r' + gs] : null, Rb = F.rbare;
    const learnedGear = !!(Rg && Rg.nh + Rg.nn > 0 && Rb && Rb.v > 0);
    const saved = learnedGear && Rg.v > Rb.v ? F.fhours.v * (1 - Rb.v / Rg.v) : 0;
    const gl = !learnedGear && (h.basket > 0 || h.bag > 0), gb = h.bag > 0, gbf = !learnedGear && gb;
    for (let q = 0; q < NF; q++) {
      const lf = (FOOD_LOOSE[q] ? gl : gbf) && F['l' + FOODS[q]] ? F['l' + FOODS[q]].v : 0;
      const x = fq[q] * rot[q] + S * (inf[q] + lf + (lr && F[FOODS[q]] ? lr * F[FOODS[q]].v : 0));
      fq[q] = x > 0 ? x : 0;
    }
    h.wood = Math.max(0, h.wood + S * (F.wood.v * wMult * (1 + lr) + F.xwood.v + (gb && F.lwood ? F.lwood.v * wMult : 0)));
    for (const g of GEAR) if (h[g] > 0) h[g] = Math.max(0, h[g] - G[g].wear * S);
    // its best weapon adds its multiple of big game's share of the meat, and wears by the hours
    // hunted
    if (sp > 0) {
      fq[FOOD_MEAT] += S * (TOOLS[wt].mult - 1) * sp;
      h[wt] = Math.max(0, h[wt] - S * sp / Math.max(1, agent.rate(A_HUNT)) / TOOLS[wt].life);
    }
    if (h.pot > 0) h.pot = Math.max(0, h.pot - G.pot.wear * S);
    const covered = Math.min(S, waterDays);
    waterDays -= covered;
    let work = Math.max(0, agent.busyHabit[si].v - saved) + agent.drinkTrip * Math.min(1, N.waterDecay / waterCarried(h)) * (1 - covered / S) + carryWork / S;
    carryWork = 0;
    // harvest (Stage 5d): fields sown before (this year's, at the first ripening) and any the
    // projection sowed come back at the agent's learned return, less the hours of reaping
    if (T.ripe) {
      const add = projSown + (ripened ? 0 : arriving);
      ripened = true; projSown = 0;
      if (add > 0) { fq[FOOD_GRAIN] += add; work += add / G.grain.reapPerHour / S; }
    }
    // weather (as wearShelter)
    lean = Math.max(0, lean - G.leanTo.wear * S);
    if (hut > 0) {
      hut = Math.max(0, hut - (hutDone ? G.hut.wear : G.hut.partWear) * S);
      if (hut <= 0) hutDone = false;
    }
    const ins = Math.max(G.leanTo.insulation * lean, hutDone ? G.hut.insulation * hut : 0);
    // the step starts nearer the agent's usual food level for the season: a gap from it fades
    // (half a week), as a hungry agent forages more and a full one less. (Without this, lived
    // inflows that just cover the day's need carried tonight's hunger unchanged for months,
    // and food outweighed even a lethal thirst.)
    const Lf = agent.livedFood[si].v;
    let food = Lf + T.persist * (nf - Lf) - S * (N.foodDecay * fs + N.workBurn * work);
    const fire = Math.min(1, h.wood / (G.fireWood * S));
    h.wood -= fire * G.fireWood * S;
    const pot = h.pot > 0;
    for (let q = 0; q < NF && food < 1; q++) {
      const have = fq[q];
      if (!(have > 0)) continue;
      const per = FOOD_REST[q] * (FOOD_POT[q] && !pot ? 1 : 1 + fire * FOOD_COOK[q]), eat = Math.min(have, (1 - food) / per);
      food += eat * per; fq[q] = have - eat;
    }
    food = Math.min(food, 1);
    const warmth = clamp(1 - cold(T) * (1 - ins) + fire * G.fireHeat, 0, 1);
    const rest = clamp((capAhead - work) / N.restSet, 0, 1);
    const fl = food >= 0 ? food : Math.max(-1, food / RF);   // below zero, the way to death (needLevel)
    if (fl <= -1) {
      // starved in the projection: dead from here on, every day the worst (death costed as the
      // life ahead, ODD §2 Game, Decided 2026-11-11; as tonight's lethal night is)
      for (let j = k; j < tab.length; j++) cost += tab[j].beta * tab[j].len * WORST_NEED_COST;
      return cost;
    }
    cost += T.beta * S * (sq(fl) + sq(warmth) + sq(rest) + belongCost);   // water drunk: no deficit
    nf = food;
    // spring sowing (Stage 5d): grain still held is sown, as with the axe and the pot (made
    // when the inputs are in hand), on the best land near home; its hours fall in the next step
    if (T.sow && farming && fq[FOOD_GRAIN] > 0) {
      projSown += fq[FOOD_GRAIN] * agent.farmFert * agent.farmReturn;
      carryWork = fq[FOOD_GRAIN] / G.grain.sowPerHour;
      fq[FOOD_GRAIN] = 0;
    }
  }
  return cost;
}

// The foods as arrays in FOODS order, for the projection's loop: food per unit, cooking's
// extra share, whether cooking needs a pot; and the index of grain (sown and harvested)
var FOOD_REST = FOODS.map((k) => PARAMETERS.goods[k].restores);
var FOOD_COOK = FOODS.map((k) => PARAMETERS.goods[k].cookedBonus - 1);
var FOOD_POT = FOODS.map((k) => !!PARAMETERS.goods[k].potCook);
var FOOD_GRAIN = FOODS.indexOf('grain');
var FOOD_MEAT = FOODS.indexOf('meat');
var FQ_SCRATCH = new Float64Array(FOODS.length);
// Each season's daily inflow of each food, gathered and netted in exchange (0 for foods that
// are only made): worked out once a day per agent, since the flows are learned in the evening.
function foodInflows(agent, world) {
  if (agent._inflowDay === world.day && agent._inflow) return agent._inflow;
  agent._inflowDay = world.day;
  return (agent._inflow = agent.flow.map((F) => Float64Array.from(FOODS, (k) => F[k] ? F[k].v + F['x' + k].v : 0)));
}

// The curiosity term for tinkering (ODD §7.3, §4.4): the discoveries the agent expects, from
// how often its own tinkering has paid per hour per material at hand (a hopeful prior that
// fruitless hours wear down), times the value it puts on a discovery. It cannot know what is
// left to find, only what it has at hand.
function tinkerBonus(agent, world, hold, hex, hours) {
  const A = PARAMETERS.agents, T = agent.tinker;
  const m = materialsAt(agent, world, hex, hold, false).size;
  const rate = (T.found + A.tinkerPrior.found) / (T.mh + A.tinkerPrior.mh);
  return A.tinkerValue * rate * hours * m;
}

// Partial projects (ODD §7.6, Decided): work unfinished at dark is worth the finished good's
// value, less the work still left, discounted by the risk of not finishing. As built: the
// finished hut's value is what the Keep projection gives it today (hutValue); the work is the
// hours the whole hut takes — building (fewer with an axe) and getting its inputs, at the
// agent's own hour costs — and the share of those hours already in hand (progress, and clay
// held toward the rest) is the share of the value counted, times the learned chance of
// finishing. So every hour put in is worth the same share whatever the season, and the agent
// puts hours in when they are cheapest to it. Wood is not counted toward it: it is fuel too,
// and the projection already values it.
function hutValue(agent, world) {
  if (!agent.knows.has('hut') || agent.shelter.hutDone) return 0;
  const bare = Object.assign({}, agent.shelter, { hut: 0, hutDone: false });
  const no = keepCost(agent, world, agent.hold, bare, 0, true, agent.need.belonging);
  const yes = keepCost(agent, world, agent.hold, Object.assign({}, bare, { hut: 1, hutDone: true }), 0, true, agent.need.belonging);
  return Math.max(0, no - yes);
}
function projectValue(agent, world, hold, sh) {
  if (!agent.hutV || sh.hutDone || !agent.knows.has('hut')) return 0;
  const B = BUILDS.hut, c = hourCosts(agent, world);
  let T = B.hours / (hold.axe > 0 ? TOOLS.axe.mult : 1);
  for (const g in B.inputs) T += B.inputs[g] * c[g];
  if (!(T < Infinity)) return 0;   // an input it knows nowhere to get
  const inHand = sh.hut * T + Math.min(hold.clay || 0, (1 - sh.hut) * B.inputs.clay) * c.clay;
  return agent.pFinish() * agent.hutV * Math.min(1, inHand / T);
}

// The projection's weeks for today: discount, season and cold of each, worked out once a day.
function projectionTable(world) {
  if (world._projDay === world.day && world._projTab) return world._projTab;
  const A = PARAMETERS.agents, Y = PARAMETERS.year.days, Gr = PARAMETERS.goods.grain;
  const tab = [];
  // weekly steps to `horizon`, then monthly to `horizonFar` (a year: farming's cycle)
  const ends = [];
  for (let d = A.keepStep; d <= A.horizon; d += A.keepStep) ends.push(d);
  for (let d = A.horizon + A.keepLongStep; d <= A.horizonFar; d += A.keepLongStep) ends.push(d);
  // does an absolute day of the year `doy` (any year) fall in (a, b]?
  const crosses = (a, b, doy) => { for (let n = Math.floor(a / Y); n * Y + doy <= b; n++) if (n * Y + doy > a) return true; return false; };
  let prev = 0;
  for (const d of ends) {
    const len = d - prev, a = world.day + prev, b = world.day + d;
    tab.push({
      len, beta: Math.pow(A.discount, d), si: Math.floor(((world.day + d) % Y) / Y * 4), cold: world.season(world.day + d).cold,
      rot: FOODS.map((k) => Math.pow(1 - PARAMETERS.goods[k].rot, len)),   // each food's keeping over the step
      persist: Math.pow(A.keepPersist, len / 7),
      ripe: crosses(a, b, Gr.ripeDay),          // this step holds a harvest (Stage 5d)
      sow: crosses(a, b, Gr.sowDay),            // this step holds the spring sowing
    });
    prev = d;
  }
  tab.coldNow = world.season(world.day).cold;
  world._projDay = world.day; world._projTab = tab;
  return tab;
}

// the recipes the Keep projection assumes made, with their inputs as [good, quantity] lists
var KEEP_RECIPES = Object.keys(RECIPES).filter((r) => RECIPES[r].keep).map((r) => [r, Object.entries(RECIPES[r].inputs)]);

// the need cost of a day with every need at its worst: food, water and warmth at death (-1),
// rest and belonging at 0
var WORST_NEED_COST = 3 * 4 + 1 + 1;

// tonight's need cost; below zero each need counts as the way to death (ODD §2 Needs)
function needCost(e, withRest, belonging, coldDays) {
  const sq = (x) => (1 - x) * (1 - x);
  return sq(needLevel('food', e.food)) + sq(needLevel('water', e.water)) + sq(needLevel('warmth', e.warmth, coldDays)) +
    (withRest ? sq(e.rest) : 0) + sq(belonging);
}

// ── planning together (ODD §7.6, Default 2026-11-04) ─────────────────────────────────────
// Each morning at camp, in a random order, each agent plans its day and announces what it
// expects to bring home. Those planning after count each tie's announced haul as coming in
// tonight, times a learned value per tie: how much of that tie's announced hauls has come back
// to it as gifts or swaps. No threshold and no household: the group is as wide as trust and
// that record reach.
function campMates(agent, world) {
  return agent.camp ? agent.camp.members : world.agents.filter((b) => b.home === agent.home && !b.carer);
}
function expectedIncoming(agent, world) {
  const day = world.day;
  let out = null;
  for (const b of campMates(agent, world)) {
    if (b === agent || !b.announced || !agent.ties.has(b.id)) continue;
    const t = agent.tie(b.id, day);
    if (!t.rel || !(t.rel.v > 0) || !(t.kind > 0)) continue;
    for (const g in b.announced) {
      if (!out) out = {};
      out[g] = (out[g] || 0) + t.rel.v * b.announced[g];
    }
  }
  return out;
}
// what its plan expects to gather, by good
function announcedHaul(agent, world) {
  const out = {};
  for (const s of agent.plan) {
    if (!IS_GATHER[s.act] && s.act !== A_HUNT) continue;
    const g = GOOD_OF[s.act];
    out[g] = (out[g] || 0) + planEstimate(agent, s.hex, s.act, world.day, world) * s.hours;
  }
  return out;
}
// After the evening's exchange: for each tie at camp that announced a haul today, the share
// of it that came back (gifts and swaps received from that tie), by one error-driven update.
function learnReliability(world) {
  const day = world.day, r = PARAMETERS.agents.learnRate;
  for (const a of world.agents) {
    if (a.carer) { a.recv = null; continue; }
    for (const b of campMates(a, world)) {
      if (b === a || !b.announced || !a.ties.has(b.id)) continue;
      let said = 0;
      for (const g in b.announced) said += b.announced[g];
      if (!(said > 0)) continue;
      const t = a.tie(b.id, day);
      if (!t.rel) t.rel = newLearned(0);
      learnOwn(t.rel, Math.min(1, ((a.recv && a.recv.get(b.id)) || 0) / said), r);
    }
    a.recv = null;
  }
}

// Meat an hour of big-game hunting from a stop is expected to bring (ODD §2 Game, Stage 5h): its
// learned meat per hour at full sign, times the sign it expects there, its spear, its own work
// rate, and the party it expects: campmates who have planned a hunt within a hex of it this
// morning (planning together, §7.6; parties are emergent).
function huntEstimate(agent, hex, world) {
  const ht = huntTool(agent.hold), tool = ht ? TOOLS[ht].mult : 1;
  let k = 1;
  if (world) for (const b of campMates(agent, world)) {
    if (b === agent || !b.announced || !b.plan) continue;
    if (b.plan.some((s) => s.act === A_HUNT && world.grid.dist(s.hex, hex) <= 1)) k++;
  }
  return agent.rate(A_HUNT) * tool * workRate(agent) * herdExpect(agent, world, hex) * partyFactor(k) / partyFactor(1);
}

// hours from `hex` to the nearest place it knows it can drink
function knownWaterFrom(agent, world, hex) {
  const tr = world.travel(hex);
  let best = Infinity;
  for (const m of world.grid.within(hex, 6)) if (agent.known[m] && world.waterAt[m] >= 0 && tr[m] < best) best = tr[m];
  return best;
}
