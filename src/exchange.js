'use strict';
// The exchange phase (ODD §3 phase 3): at every hex where agents met today, first gifts to
// those in need, then barter in rounds, one good at a time, scarcest first.
//
// Goods: GOODS in tree.js (water stays in the gourd). A barter price is an exchange ratio
// (ODD §7.2) for a pair of goods, quoted one way: for the pair (a, b) with a before b in
// GOODS, `p` is units of a per unit of b. Each pair has its own going rate (n(n−1)/2 of them).
//
// Rules, all from the ODD:
// - Gifts (§7.1, §7.6 Give arm): a tie gives on need, with no price, when giving lowers its
//   own cost — the gift is a trade for belonging (Chris). Strongest ties first; not to someone
//   whose unreturned gifts have passed the giver's limit (the owing balance, §2).
// - Barter (§7.2): each side values a good by the hours it would cost to get it itself,
//   adjusted by need; its fair bid is the geometric middle of its own limit and its estimate of
//   the other's, it bids the better for itself of that and the going rate, and the deal lands
//   at the geometric midpoint of the two bids. Walk-away guard: each side must still gain, by
//   its limit and by its own need (lot by lot, through the same cost the planner uses).
// - Matching (§4.7): rounds per good, scarcest first (wanted ÷ held at the place); holders
//   of that good, in random order, pick the partner and good giving them the largest gain.

function pairKey(a, b) { return GOODS.indexOf(a) < GOODS.indexOf(b) ? a + '|' + b : b + '|' + a; }

function exchangeDay(world, live) {
  const at = new Map();
  for (const a of live) {
    a.costs = null;                     // hour costs are worked out once per day, when needed
    a.mu = null;                        // marginal values, recomputed when holdings change
    a.tradedToday = false;
    for (const h of a.places) {
      let list = at.get(h);
      if (!list) at.set(h, list = []);
      if (list.indexOf(a) < 0) list.push(a);
    }
  }
  world.tradesToday = [];
  const hexes = [...at.keys()].filter((h) => at.get(h).length > 1);
  shuffleInPlace(hexes, world.rng);
  for (const h of hexes) {
    const here = at.get(h);
    giftsAt(world, here);
    barterAt(world, h, here);
  }
  // trades seen where one stood: every agent at the hex learns the rate (price norms, §7.2)
  for (const t of world.tradesToday) for (const a of at.get(t.hex)) a.observePrice(t.key, t.p);
  for (const a of live) a.tradeRel += PARAMETERS.exchange.relRate * ((a.tradedToday ? 1 : 0) - a.tradeRel);
}

function shuffleInPlace(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

// ── own valuation ──────────────────────────────────────────────────────────────────────
// Hours per unit of each good: gathered goods at the agent's best known source within reach
// (a trip yields rate × fullness × tool × chunk units for 2 × travel + chunk hours); a made
// good is its recipe's hours plus its inputs' hours.
function hourCosts(agent, world) {
  if (agent.costs) return agent.costs;
  const A = PARAMETERS.agents;
  const reach = agent.capacity() / 2, tr = world.travel(agent.home);
  const out = {};
  for (const act of GATHER) {
    const tool = TOOL_FOR[act], mult = tool && agent.hold[tool] > 0 ? TOOLS[tool].mult : 1;
    const rate = agent.rate(act) * mult, seen = agent.seenFrac[act];
    let best = Infinity;
    for (let h = 0; h < world.grid.n; h++) {
      if (!agent.known[h] || !(tr[h] <= reach) || !(seen[h] > 0.02)) continue;
      const c = (2 * tr[h] + A.chunk) / (rate * seen[h] * A.chunk);
      if (c < best) best = c;
    }
    out[GOOD_OF[act]] = best;
  }
  for (const r in RECIPES) {
    let c = RECIPES[r].hours;
    for (const g in RECIPES[r].inputs) c += RECIPES[r].inputs[g] * out[g];
    out[r] = c;
  }
  return (agent.costs = out);
}

// Marginal value of one more unit of good g to the agent's cost (tonight plus Keep), by
// central difference on its holdings; cached until its holdings change.
function marginal(agent, world, g) {
  if (!agent.mu) agent.mu = {};
  if (agent.mu[g] != null) return agent.mu[g];
  const d = WHOLE[g] ? 1 : PARAMETERS.exchange.marginalLot, h = agent.hold;
  const lo = Object.assign({}, h), hi = Object.assign({}, h);
  lo[g] = Math.max(0, h[g] - d);
  hi[g] = h[g] + d;
  const v = (costWith(agent, world, lo) - costWith(agent, world, hi)) / (hi[g] - lo[g]);
  return (agent.mu[g] = Math.max(0, v));
}

// The agent's own limit for the pair (a, b): units of a that one unit of b is worth to it —
// the hours each would cost it to get, adjusted by need (ODD §7.2). The need part is the
// ratio of marginal values; plain hour costs are a small baseline that decides when its
// needs are flat in both goods.
function ownRatio(agent, world, a, b) {
  const c = hourCosts(agent, world), E = PARAMETERS.exchange;
  const ua = marginal(agent, world, a) + E.hoursBaseline / c[a];
  const ub = marginal(agent, world, b) + E.hoursBaseline / c[b];
  return ub / ua;
}

// Its estimate of another's limit (ODD §7.2): the particular other if it has traded this
// pair with it before, else cost norms (the generalized other: others' rates), as hours.
function estRatio(agent, other, a, b) {
  const t = agent.ties.get(other.id), key = a + '|' + b;
  if (t && t.ratio && t.ratio[key]) return t.ratio[key];
  const c = normCosts(agent);
  return c[b] / c[a];
}
function normCosts(agent) {
  const out = {};
  for (const act of GATHER) {
    const r = agent.norm.n[act] ? agent.norm.eff[act] : agent.rate(act);
    out[GOOD_OF[act]] = 1 / r;
  }
  for (const r in RECIPES) {
    let c = RECIPES[r].hours;
    for (const g in RECIPES[r].inputs) c += RECIPES[r].inputs[g] * out[g];
    out[r] = c;
  }
  return out;
}

// What the agent's day ends at with `hold` instead of its current holdings (lower = better).
function costWith(agent, world, hold, belonging) {
  return holdingsCost(agent, world, hold, agent.shelter, agent.busy, agent.drank,
    belonging == null ? agent.need.belonging : belonging, false);
}

// ── gifts ──────────────────────────────────────────────────────────────────────────────
// Units of a good the agent lacks for tonight (food to its set point; wood for one fire).
function shortfall(agent, g) {
  const N = PARAMETERS.needs, G = PARAMETERS.goods;
  if (g === 'food') {
    const tonight = agent.need.food - N.foodDecay - N.workBurn * agent.busy;
    return Math.max(0, (1 - tonight) / G.food.restores - agent.hold.food);
  }
  if (g === 'wood') return Math.max(0, G.fireWood - agent.hold.wood);
  return 0;
}

function giftsAt(world, here) {
  const E = PARAMETERS.exchange;
  for (const g of ['food', 'wood']) {
    for (const j of here) {
      let need = shortfall(j, g);
      if (need <= 0) continue;
      // givers with a tie to j, strongest first
      const givers = here.filter((i) => i !== j && i.hold[g] > 0 && i.trust(j.id, world.day) > 0);
      givers.sort((x, y) => y.trust(j.id, world.day) - x.trust(j.id, world.day));
      for (const i of givers) {
        if (need <= 0) break;
        if (i.owedBy(j.id, world.day) >= E.owedLimit) continue;          // a grudge: unreturned gifts
        const amount = Math.min(need, i.hold[g]);
        const before = costWith(i, world, i.hold);
        const hold2 = Object.assign({}, i.hold);
        hold2[g] -= amount;
        const cAfter = costWith(i, world, hold2, i.belongingIfGave(j.id, world.day));
        if (cAfter >= before) continue;                                   // giving must pay the giver
        i.hold[g] -= amount; i.mu = null;
        j.hold[g] += amount; j.mu = null;
        need -= amount;
        i.gave(j.id, world.day);
        j.received(i.id, world.day);
        world.giftsToday = (world.giftsToday || 0) + 1;
      }
    }
  }
}

// ── barter ─────────────────────────────────────────────────────────────────────────────
function barterAt(world, hex, here) {
  // scarcity of each good here: wanted (tonight's shortfalls) ÷ held
  const scar = GOODS.map((g) => {
    let wanted = 0, held = 0;
    for (const a of here) { wanted += shortfall(a, g); held += a.hold[g]; }
    return held > 0 ? wanted / held : (wanted > 0 ? Infinity : 0);
  });
  const rounds = GOODS.map((g, k) => k).filter((k) => here.some((a) => canGive(a, GOODS[k])));
  shuffleInPlace(rounds, world.rng).sort((x, y) => scar[y] - scar[x]);
  for (const k of rounds) {
    const g = GOODS[k];
    const holders = shuffleInPlace(here.filter((a) => canGive(a, g)), world.rng);
    const done = new Set();
    for (const i of holders) {
      // i offers g; pick the partner and the good in return giving i the largest gain
      let best = null;
      for (const j of here) {
        if (j === i || done.has(j.id)) continue;
        for (const l of GOODS) {
          if (l === g || !canGive(j, l)) continue;
          const deal = priceFor(world, i, g, j, l);
          if (!deal) continue;
          const gain = lotGain(world, i, g, j, l, deal).gi;
          if (gain > 0 && (!best || gain > best.gain)) best = { j, l, deal, gain };
        }
      }
      if (!best) continue;
      done.add(best.j.id);
      trade(world, hex, i, g, best.j, best.l, best.deal);
    }
  }
}

function canGive(a, g) { return WHOLE[g] ? a.hold[g] >= 1 : a.hold[g] > 1e-6; }

// Bid rule (ODD §7.2) for i giving g to j for l. Returns r, the units of l per unit of g, and
// a lot size in units of g, or null if the limits leave no gain.
function priceFor(world, i, g, j, l) {
  // limits as units of l per unit of g: i accepts at least vi, j pays at most vj
  const vi = ownRatio(i, world, l, g), vj = ownRatio(j, world, l, g);
  if (!(vj > vi)) return null;
  const going = (a) => {
    const P = a.price[pairKey(g, l)];
    if (!P) return null;
    const p = Math.exp(P.logp);   // units of the first per unit of the second
    return GOODS.indexOf(l) < GOODS.indexOf(g) ? p : 1 / p;
  };
  const fairI = Math.sqrt(vi * estRatio(i, j, l, g)), fairJ = Math.sqrt(vj * estRatio(j, i, l, g));
  const gi = going(i), gj = going(j);
  const bidI = gi ? Math.max(fairI, gi) : fairI;      // i wants much l for its g
  const bidJ = gj ? Math.min(fairJ, gj) : fairJ;      // j wants to pay little l
  const r = Math.sqrt(bidI * bidJ);
  if (!(r >= vi && r <= vj)) return null;              // walk-away guard, by limits
  const lot = WHOLE[g] ? 1 : Math.max(1, 0.1 * i.hold[g]);
  return { r, lot, fairI, fairJ };
}

// Change in each side's cost from one lot (i gives `lot` of g for lot × r of l); + = gain.
function lotGain(world, i, g, j, l, deal) {
  let w = Math.min(deal.lot, i.hold[g], j.hold[l] / deal.r);
  if (WHOLE[g]) w = Math.floor(w);
  if (WHOLE[l] && w * deal.r > j.hold[l] + 1e-9) w = 0;
  if (!(w > 1e-6)) return { gi: -1, gj: -1, w: 0 };
  const hi = Object.assign({}, i.hold), hj = Object.assign({}, j.hold);
  hi[g] -= w; hi[l] += w * deal.r;
  hj[g] += w; hj[l] -= w * deal.r;
  return {
    gi: costWith(i, world, i.hold) - costWith(i, world, hi),
    gj: costWith(j, world, j.hold) - costWith(j, world, hj),
    w,
  };
}

// Trade lot by lot while both still gain by their own need (walk-away guard), then record
// the price and the kindness each side judges it received.
function trade(world, hex, i, g, j, l, deal) {
  const E = PARAMETERS.exchange;
  let moved = 0;
  for (let n = 0; n < E.maxLots; n++) {
    const x = lotGain(world, i, g, j, l, deal);
    if (!(x.gi > 0 && x.gj > 0)) break;
    i.hold[g] -= x.w; i.hold[l] += x.w * deal.r;
    j.hold[g] += x.w; j.hold[l] -= x.w * deal.r;
    i.mu = j.mu = null;
    moved += x.w;
  }
  if (moved <= 0) return;
  i.tradedToday = j.tradedToday = true;
  // the price in the pair's own quote: units of the first good per unit of the second
  const key = pairKey(g, l), first = key.split('|')[0];
  const p = first === l ? deal.r : 1 / deal.r;
  world.tradesToday.push({ hex, key, p, give: g, get: l, qty: moved, seller: i.id, buyer: j.id,
    // the model knows true limits; log each side's estimate error (ODD §7.2 measurement)
    errI: Math.log(estRatio(i, j, l, g) / ownRatio(j, world, l, g)),
    errJ: Math.log(estRatio(j, i, l, g) / ownRatio(i, world, l, g)) });
  // kindness, judged against each side's own fair middle (ODD §2 Ties)
  i.traded(j.id, world.day, deal.r >= deal.fairI, key, p);
  j.traded(i.id, world.day, deal.r <= deal.fairJ, key, p);
}
