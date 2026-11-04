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
  const cands = planCandidates(agent, world);
  // candidates are ranked without the trade arm (five times cheaper; the route itself is
  // built and chosen with it)
  const base0 = planCost(agent, world, [], false);
  for (const c of cands) {
    c.solo = planCost(agent, world, [c], false);
    c.rate = (base0 - c.solo) / planHours(agent, world, [c]);
  }
  const top = [], half = Math.ceil(A.topPerActivity / 2);
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
  return byRate.cost < byGain.cost ? byRate : byGain;
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
      if (s.act === A_DRINK || s.act === A_SCOUT || s.act === A_CRAFT || s.act === A_TINKER) continue;   // fixed-length stops
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
// (pendingGrain). The agent is restored after.
function siteDay(agent, world, hex, walk) {
  const keep = { home: agent.home, shelter: agent.shelter, drinkTrip: agent.drinkTrip,
    farmFert: agent.farmFert, hutV: agent.hutV, walked: agent.walked };
  agent.walked = 0;
  agent.walked = Math.min(walk, agent.capacity());
  if (hex !== agent.home) {
    agent.settle(world, hex);
    agent.shelter = (world.dwellings && world.bestDwelling(hex, agent)) || newShelter(hex);
  }
  const cost = planBest(agent, world, false).cost;
  Object.assign(agent, keep);
  agent.costs = null;
  return cost;
}

// Hours a route takes: travel between its stops and back home, and the work at each.
function planHours(agent, world, plan) {
  let at = agent.home, h = 0;
  for (const s of plan) { h += world.travel(at)[s.hex] + s.hours; at = s.hex; }
  return plan.length ? h + world.travel(at)[agent.home] : 0;
}

// Everything the agent could do today: gather or drink at known hexes within reach, build
// or make what it knows at home, tinker, or walk to an unseen hex to look.
function planCandidates(agent, world) {
  const A = PARAMETERS.agents;
  const reach = agent.capacity() / 2;
  const fromHome = world.travel(agent.home);
  const out = [], unseen = [], tinkerAt = [], fields = [];
  const sowing = agent.knows.has('farm') && agent.hold.grain > 0 && world.season().phase < 0.25;
  for (let h = 0; h < world.grid.n; h++) {
    if (!(fromHome[h] <= reach)) continue;
    if (!agent.known[h]) { unseen.push(h); continue; }
    if (world.caps.plants[h] > 0) out.push({ hex: h, act: A_FORAGE, hours: A.chunk, unknown: 0 });
    if (world.caps.wood[h] > 0) out.push({ hex: h, act: A_WOOD, hours: A.chunk, unknown: 0 });
    if (world.waterAt[h] >= 0) out.push({ hex: h, act: A_DRINK, hours: A.drinkHours, unknown: 0 });
    if (world.caps.flint[h] > 0) out.push({ hex: h, act: A_QUARRY, hours: A.chunk, unknown: 0 });
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
  // sow on the most fertile land within reach, nearer first among equals
  fields.sort((a, b) => world.fertility(b) / (1 + fromHome[b]) - world.fertility(a) / (1 + fromHome[a]));
  for (const h of fields.slice(0, A.sowCandidates)) out.push({ hex: h, act: A_SOW, hours: A.chunk, unknown: 0 });
  // tinker at home, or at the nearest places with stone or clay
  tinkerAt.sort((a, b) => fromHome[a] - fromHome[b]);
  for (const h of [agent.home].concat(tinkerAt.slice(0, A.tinkerCandidates))) {
    out.push({ hex: h, act: A_TINKER, hours: A.tinkerHours, unknown: 0 });
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
function planEstimate(agent, hex, act, day) {
  const A = PARAMETERS.agents;
  const frac = agent.seenFrac[act][hex];
  const sd = A.sightSd * (1 - Math.exp(-(day - agent.seenDay[hex]) / A.sightMemory));
  const tool = TOOL_FOR[act], mult = tool && agent.hold[tool] > 0 ? TOOLS[tool].mult : 1;
  return agent.rate(act) * mult * Math.min(1, frac + A.curiosity * sd);
}

function planCost(agent, world, plan, withTrade) {
  const A = PARAMETERS.agents, G = PARAMETERS.goods;
  const cap = agent.capacity();
  let at = agent.home, hours = 0, bonus = 0;
  const hold = Object.assign({}, agent.hold);
  const shelter = Object.assign({}, agent.shelter);
  let drank = false;
  for (const s of plan) {
    hours += world.travel(at)[s.hex];
    at = s.hex;
    if (IS_GATHER[s.act]) {
      const est = planEstimate(agent, s.hex, s.act, world.day);
      const tool = TOOL_FOR[s.act];
      if (tool && hold[tool] > 0) hold[tool] = Math.max(0, hold[tool] - s.hours / TOOLS[tool].life);
      hold[GOOD_OF[s.act]] += est * s.hours;
    } else if (s.act === A_DRINK) { drank = true; hold.water = Math.max(hold.water, waterCarried(hold)); }
    else if (s.act === A_BUILD) {
      if (!(buildWork(shelter, hold, s.build, s.hours) > 0)) return Infinity;   // nothing to work with
    } else if (s.act === A_CRAFT) {
      const R = RECIPES[s.recipe];
      if (!Object.keys(R.inputs).every((g) => hold[g] >= R.inputs[g])) return Infinity;
      for (const g in R.inputs) hold[g] -= R.inputs[g];
      hold[s.recipe] += 1;
    } else if (s.act === A_SOW) {
      // what it sows comes back at harvest at its learned return (projected in keepCost)
      const seeds = Math.min(hold.grain, s.hours * G.grain.sowPerHour * (hold.hoe > 0 ? TOOLS.hoe.mult : 1));
      if (!(seeds > 1e-6)) return Infinity;
      hold.grain -= seeds;
      hold.sown = (hold.sown || 0) + seeds * world.fertility(s.hex) * agent.farmReturn;
    } else if (s.act === A_REAP) {
      hold.grain += Math.min(agent.seenGrain[s.hex], s.hours * G.grain.reapPerHour * (hold.sickle > 0 ? TOOLS.sickle.mult : 1));
    } else if (s.act === A_SCOUT) bonus += A.scoutValue * s.unknown;
    else if (s.act === A_TINKER) bonus += tinkerBonus(agent, world, hold, s.hex, s.hours);
    hours += s.hours;
  }
  if (plan.length) hours += world.travel(at)[agent.home];
  if (!(hours <= cap)) return Infinity;
  return holdingsCost(agent, world, hold, shelter, hours, drank, agent.need.belonging, withTrade !== false) - bonus;
}

// The cost of ending the day with `hold`: tonight's evening plus the Keep projection. With
// `withTrade`, the Trade arm too (ODD §7.6 best of keep / trade / give; trade enters the
// plan): part of one good may be swapped for the other at the going rate, discounted by how
// reliably the agent's trades have come off, and the cheaper outcome counts. (Give is decided
// in the exchange phase, where the recipient's need is known; exchange.js.)
function holdingsCost(agent, world, hold, shelter, busy, drank, belonging, withTrade) {
  const keep = (h) => keepCost(agent, world, h, shelter, busy, drank, belonging) - projectValue(agent, world, h, shelter);
  let best = keep(hold);
  const P = agent.price['food|wood'];
  if (!withTrade || !P || !(agent.tradeRel > 0.01)) return best;
  const p = Math.exp(P.logp), rel = agent.tradeRel;   // p: food per unit of wood
  for (const f of [0.25, 0.5]) {
    if (hold.food > 0) {
      const give = f * hold.food;
      const c = keep(Object.assign({}, hold, { food: hold.food - rel * give, wood: hold.wood + rel * give / p }));
      if (c < best) best = c;
    }
    if (hold.wood > 0) {
      const give = f * hold.wood;
      const c = keep(Object.assign({}, hold, { food: hold.food + rel * give * p, wood: hold.wood - rel * give }));
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
  const e = Agent.evening(agent.need, hold, shelterIns(shelter), busy, drank, tab.coldNow, cap);
  let cost = needCost(e, true, belonging, agent.coldDays);
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
  let projSown = 0, ripened = false, carryWork = 0;
  const rateWood = Math.max(0.1, agent.rate(A_WOOD));
  const keeps = KEEP_RECIPES.filter(([r]) => agent.knows.has(r));
  const capAhead = cap + agent.walked;   // a walk moving camp shortens today only
  const belongCost = sq(belonging), RF = needReserve('food');
  let waterDays = (h.water || 0) / N.waterDecay;   // days of drinking the water held covers
  for (let k = 0; k < tab.length; k++) {
    const T = tab[k], S = T.len, si = T.si;
    for (const [r, ins] of keeps) {
      if (h[r] > 0) continue;
      if (ins.every(([g, q]) => h[g] >= q)) {
        for (const [g, q] of ins) h[g] -= q;
        h[r] = 1;
      }
    }
    // the axe speeds the projected wood-cutting while it lasts
    const wMult = h.axe > 0 ? TOOLS.axe.mult : 1;
    // a step as the agent has lived this season: what it brings in by gathering and nets in
    // exchange (ODD §7.6: expected future need from seasonal norms)
    const F = agent.flow[si];
    if (h.axe > 0) h.axe = Math.max(0, h.axe - S * F.wood.v / rateWood / TOOLS.axe.life);
    h.food = Math.max(0, h.food * T.rot + S * (F.food.v + F.xfood.v));
    h.wood = Math.max(0, h.wood + S * (F.wood.v * wMult + F.xwood.v));
    if (h.pot > 0) h.pot = Math.max(0, h.pot - G.pot.wear * S);
    h.grain = (h.grain || 0) * T.grot;
    const covered = Math.min(S, waterDays);
    waterDays -= covered;
    let work = agent.busyHabit[si].v + agent.drinkTrip * Math.min(1, N.waterDecay / waterCarried(h)) * (1 - covered / S) + carryWork / S;
    carryWork = 0;
    // harvest (Stage 5d): fields sown before (this year's, at the first ripening) and any the
    // projection sowed come back at the agent's learned return, less the hours of reaping
    if (T.ripe) {
      const add = projSown + (ripened ? 0 : arriving);
      ripened = true; projSown = 0;
      if (add > 0) { h.grain += add; work += add / G.grain.reapPerHour / S; }
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
    let food = Lf + T.persist * (nf - Lf) - S * (N.foodDecay + N.workBurn * work);
    const fire = Math.min(1, h.wood / (G.fireWood * S));
    h.wood -= fire * G.fireWood * S;
    const per = G.food.restores * (1 + fire * (G.food.cookedBonus - 1));
    if (food < 1 && h.food > 0) { const eat = Math.min(h.food, (1 - food) / per); food += eat * per; h.food -= eat; }
    const perG = G.grain.restores * (h.pot > 0 ? 1 + fire * (G.grain.cookedBonus - 1) : 1);
    if (food < 1 && h.grain > 0) { const eat = Math.min(h.grain, (1 - food) / perG); food += eat * perG; h.grain -= eat; }
    food = Math.min(food, 1);
    const warmth = clamp(1 - cold(T) * (1 - ins) + fire * G.fireHeat, 0, 1);
    const rest = clamp((capAhead - work) / N.restSet, 0, 1);
    const fl = food >= 0 ? food : Math.max(-1, food / RF);   // below zero, the way to death (needLevel)
    cost += T.beta * S * (sq(fl) + sq(warmth) + sq(rest) + belongCost);   // water drunk: no deficit
    nf = food;
    // spring sowing (Stage 5d): grain still held is sown, as with the axe and the pot (made
    // when the inputs are in hand), on the best land near home; its hours fall in the next step
    if (T.sow && farming && h.grain > 0) {
      projSown += h.grain * agent.farmFert * agent.farmReturn;
      carryWork = h.grain / G.grain.sowPerHour;
      h.grain = 0;
    }
  }
  return cost;
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
      rot: Math.pow(1 - PARAMETERS.goods.food.rot, len), grot: Math.pow(1 - Gr.rot, len),
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
