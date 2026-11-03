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
  const cands = planCandidates(agent, world);
  for (const c of cands) c.solo = planCost(agent, world, [c]);
  cands.sort((a, b) => a.solo - b.solo);
  const top = [], kept = [0, 0, 0, 0, 0];
  for (const c of cands) if (kept[c.act] < A.topPerActivity) { top.push(c); kept[c.act]++; }
  let plan = [], cost = planCost(agent, world, plan);
  for (let step = 0; step < A.maxGreedySteps; step++) {
    let bestPlan = null, bestCost = cost;
    for (let k = 0; k < plan.length; k++) {
      const s = plan[k];
      if (s.act === A_DRINK || s.act === A_SCOUT) continue;
      const p2 = plan.slice();
      p2[k] = { hex: s.hex, act: s.act, hours: s.hours + A.chunk, unknown: 0 };
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

// Everything the agent could do today: gather or drink at known hexes within reach, work
// on its lean-to at home, or walk to an unseen hex to look.
function planCandidates(agent, world) {
  const A = PARAMETERS.agents;
  const reach = agent.capacity() / 2;
  const fromHome = world.travel(agent.home);
  const out = [], unseen = [];
  for (let h = 0; h < world.grid.n; h++) {
    if (!(fromHome[h] <= reach)) continue;
    if (!agent.known[h]) { unseen.push(h); continue; }
    if (world.caps.plants[h] > 0) out.push({ hex: h, act: A_FORAGE, hours: A.chunk, unknown: 0 });
    if (world.caps.wood[h] > 0) out.push({ hex: h, act: A_WOOD, hours: A.chunk, unknown: 0 });
    if (world.waterAt[h] >= 0) out.push({ hex: h, act: A_DRINK, hours: A.drinkHours, unknown: 0 });
  }
  if (agent.shelter < 1) out.push({ hex: agent.home, act: A_BUILD, hours: A.chunk, unknown: 0 });
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
  return agent.eff[act] * Math.min(1, frac + A.curiosity * sd);
}

function planCost(agent, world, plan) {
  const A = PARAMETERS.agents, G = PARAMETERS.goods;
  const cap = agent.capacity();
  let at = agent.home, hours = 0, bonus = 0;
  let food = agent.hold.food, wood = agent.hold.wood, water = agent.hold.water, shelter = agent.shelter;
  let drank = false;
  for (const s of plan) {
    hours += world.travel(at)[s.hex];
    at = s.hex;
    if (s.act === A_FORAGE) food += planEstimate(agent, s.hex, s.act, world.day) * s.hours;
    else if (s.act === A_WOOD) wood += planEstimate(agent, s.hex, s.act, world.day) * s.hours;
    else if (s.act === A_DRINK) { drank = true; water = Math.max(water, G.gourd); }
    else if (s.act === A_BUILD) {
      const can = Math.min(s.hours / G.leanTo.hours, wood / G.leanTo.wood, 1 - shelter);
      wood -= can * G.leanTo.wood;
      shelter += can;
    } else if (s.act === A_SCOUT) bonus += A.scoutValue * s.unknown;
    hours += s.hours;
  }
  if (plan.length) hours += world.travel(at)[agent.home];
  if (!(hours <= cap)) return Infinity;
  const sea = world.season();
  const e = Agent.evening(agent.need, { food, wood, water }, shelter, hours, drank, sea.cold, cap);
  let cost = needCost(e, true);
  // Keep: the next days on what is left, with no gathering (ODD §7.6 best-of-three, Keep arm)
  let need = e, hold = e.hold, beta = 1;
  for (let d = 1; d <= A.horizon; d++) {
    beta *= A.discount;
    hold = { food: hold.food * (1 - G.food.rot), wood: hold.wood, water: hold.water };
    shelter = Math.max(0, shelter - G.leanTo.wear);
    const f = Agent.evening(need, hold, shelter, A.typicalBusy, false, world.season(world.day + d).cold, cap);
    cost += beta * needCost(f, false);
    need = f; hold = f.hold;
  }
  return cost - bonus;
}

function needCost(e, withRest) {
  const sq = (x) => (1 - x) * (1 - x);
  return sq(e.food) + sq(e.water) + sq(e.warmth) + (withRest ? sq(e.rest) : 0);
}
