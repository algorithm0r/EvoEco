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
// Search (Default): rank every candidate stop by the score of a one-stop day and keep the
// best few OF EACH ACTIVITY (ranking them all together let the most pressing need crowd every
// other activity off the shortlist), then build the route greedily — add a stop at its best position, or give an existing
// stop another chunk of hours — while the score improves.

function planDay(agent, world) {
  const A = PARAMETERS.agents;
  agent.costs = null;                     // hour costs as of this morning
  agent.hutV = hutValue(agent, world);   // worked out once a day (also used in the exchange)
  const cands = planCandidates(agent, world);
  for (const c of cands) c.solo = planCost(agent, world, [c]);
  cands.sort((a, b) => a.solo - b.solo);
  const top = [], kept = ACT_NAMES.map(() => 0);
  for (const c of cands) if (kept[c.act] < A.topPerActivity) { top.push(c); kept[c.act]++; }
  let plan = [], cost = planCost(agent, world, plan);
  for (let step = 0; step < A.maxGreedySteps; step++) {
    let bestPlan = null, bestCost = cost;
    for (let k = 0; k < plan.length; k++) {
      const s = plan[k];
      if (s.act === A_DRINK || s.act === A_SCOUT || s.act === A_CRAFT || s.act === A_TINKER) continue;   // fixed-length stops
      const p2 = plan.slice();
      p2[k] = Object.assign({}, s, { hours: s.hours + A.chunk });
      const c = planCost(agent, world, p2);
      if (c < bestCost) { bestCost = c; bestPlan = p2; }
    }
    if (plan.length < A.maxStops) {
      for (const cd of top) {
        if (plan.some((s) => s.hex === cd.hex && s.act === cd.act)) continue;
        for (let pos = 0; pos <= plan.length; pos++) {
          const p2 = plan.slice();
          p2.splice(pos, 0, cd);
          const c = planCost(agent, world, p2);
          if (c < bestCost) { bestCost = c; bestPlan = p2; }
        }
      }
    }
    if (!bestPlan) break;
    plan = bestPlan; cost = bestCost;
  }
  return plan;
}

// Everything the agent could do today: gather or drink at known hexes within reach, build
// or make what it knows at home, tinker, or walk to an unseen hex to look.
function planCandidates(agent, world) {
  const A = PARAMETERS.agents;
  const reach = agent.capacity() / 2;
  const fromHome = world.travel(agent.home);
  const out = [], unseen = [], tinkerAt = [];
  for (let h = 0; h < world.grid.n; h++) {
    if (!(fromHome[h] <= reach)) continue;
    if (!agent.known[h]) { unseen.push(h); continue; }
    if (world.caps.plants[h] > 0) out.push({ hex: h, act: A_FORAGE, hours: A.chunk, unknown: 0 });
    if (world.caps.wood[h] > 0) out.push({ hex: h, act: A_WOOD, hours: A.chunk, unknown: 0 });
    if (world.waterAt[h] >= 0) out.push({ hex: h, act: A_DRINK, hours: A.drinkHours, unknown: 0 });
    if (world.caps.flint[h] > 0) out.push({ hex: h, act: A_QUARRY, hours: A.chunk, unknown: 0 });
    if (world.caps.clay[h] > 0) out.push({ hex: h, act: A_DIG, hours: A.chunk, unknown: 0 });
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

function planCost(agent, world, plan) {
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
    } else if (s.act === A_SCOUT) bonus += A.scoutValue * s.unknown;
    else if (s.act === A_TINKER) bonus += tinkerBonus(agent, world, hold, s.hex, s.hours);
    hours += s.hours;
  }
  if (plan.length) hours += world.travel(at)[agent.home];
  if (!(hours <= cap)) return Infinity;
  return holdingsCost(agent, world, hold, shelter, hours, drank, agent.need.belonging, true) - bonus;
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
// over its storage life), with ordinary gathering at the yields the agent has known in each
// season, so a store is worth what it covers beyond that (winter). Projected in steps of
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
  const e = Agent.evening(agent.need, hold, shelterIns(shelter), busy, drank, world.season().cold, cap);
  let cost = needCost(e, true, belonging);
  let need = e, h = e.hold;
  const sh = Object.assign({}, shelter);
  const S = A.keepStep, Y = PARAMETERS.year.days;
  for (let d = S; d <= A.horizon; d += S) {
    const beta = Math.pow(A.discount, d);
    const si = Math.floor(((world.day + d) % Y) / Y * 4);
    // (h is always a fresh object from Agent.evening, so it is changed in place)
    for (const [r, ins] of KEEP_RECIPES) {
      if (h[r] > 0 || !agent.knows.has(r)) continue;
      if (ins.every(([g, q]) => h[g] >= q)) {
        for (const [g, q] of ins) h[g] -= q;
        h[r] = 1;
      }
    }
    // the axe speeds the projected wood-cutting while it lasts
    const wMult = h.axe > 0 ? TOOLS.axe.mult : 1;
    if (h.axe > 0) h.axe = Math.max(0, h.axe - S * A.projHours.wood / TOOLS.axe.life);
    h.food = h.food * Math.pow(1 - G.food.rot, S) + S * A.projHours.forage * agent.seasonYield[A_FORAGE][si];
    h.wood += S * A.projHours.wood * agent.seasonYield[A_WOOD][si] * wMult;
    h.water = 0;
    if (h.pot > 0) h.pot = Math.max(0, h.pot - G.pot.wear * S);
    const work = agent.busyHabit[si] + agent.drinkTrip * Math.min(1, N.waterDecay / waterCarried(h));
    wearShelter(sh, S);
    const f = Agent.evening(need, h, shelterIns(sh), work, true, world.season(world.day + d).cold, cap, S);
    cost += beta * S * needCost(f, true, belonging);
    need = f; h = f.hold;
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

// the recipes the Keep projection assumes made, with their inputs as [good, quantity] lists
var KEEP_RECIPES = Object.keys(RECIPES).filter((r) => RECIPES[r].keep).map((r) => [r, Object.entries(RECIPES[r].inputs)]);

function needCost(e, withRest, belonging) {
  const sq = (x) => (1 - x) * (1 - x);
  return sq(e.food) + sq(e.water) + sq(e.warmth) + (withRest ? sq(e.rest) : 0) + sq(belonging);
}
