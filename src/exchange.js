'use strict';
// The exchange phase (ODD §3 phase 3): at every hex where agents met today, first gifts to
// those in need, then barter in rounds, one good at a time, scarcest first.
//
// Goods traded in Stage 4: food and wood (water stays in the gourd). A barter price is an
// exchange ratio (ODD §7.2): `p` is units of food per unit of wood, quoted one way only.
//
// Rules, all from the ODD:
// - Gifts (§7.1, §7.6 Give arm): a tie gives on need, with no price, when giving lowers its
//   own cost — the gift is a trade for belonging (Chris). Strongest ties first; not to someone
//   whose unreturned gifts have passed the giver's limit (the owing balance, §2).
// - Barter (§7.2): each side values a good by the hours it would cost to get it itself; its
//   fair bid is the geometric middle of its own limit and its estimate of the other's, it bids
//   the better for itself of that and the going rate, and the deal lands at the geometric
//   midpoint of the two bids. Walk-away guard: each side must still gain, by its own hours and
//   by its own need (lot by lot, through the same cost the planner uses).
// - Matching (§4.7): rounds per good, scarcest first (wanted ÷ held at the place); holders
//   of that good, in random order, pick the partner giving them the largest gain.
var TGOODS = ['food', 'wood'];
var TG_ACT = [A_FORAGE, A_WOOD];

function exchangeDay(world, live) {
  const at = new Map();
  for (const a of live) {
    a.costs = null;                     // hour costs are worked out once per day, when needed
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
  for (const t of world.tradesToday) for (const a of at.get(t.hex)) a.observePrice(t.p);
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
// Hours per unit of each good at the agent's best known source within reach: a trip yields
// rate × fullness × chunk units for 2 × travel + chunk hours.
function hourCosts(agent, world) {
  if (agent.costs) return agent.costs;
  const A = PARAMETERS.agents;
  const reach = agent.capacity() / 2, tr = world.travel(agent.home);
  const out = [Infinity, Infinity];
  for (let k = 0; k < 2; k++) {
    const rate = agent.rate(TG_ACT[k]);
    const seen = agent.seenFrac[k];
    for (let h = 0; h < world.grid.n; h++) {
      if (!agent.known[h] || !(tr[h] <= reach) || !(seen[h] > 0.02)) continue;
      const y = rate * seen[h] * A.chunk;
      const c = (2 * tr[h] + A.chunk) / y;
      if (c < out[k]) out[k] = c;
    }
  }
  return (agent.costs = out);
}

// The agent's own limit: food units one unit of wood is worth to it — the hours each would
// cost it to get, adjusted by need (ODD §7.2). The need part is the marginal value of each
// good to its cost (tonight plus Keep), by central difference on its current holdings; the
// hours part is a small baseline that decides when its needs are flat in both goods.
function ownRatio(agent, world) {
  const c = hourCosts(agent, world), E = PARAMETERS.exchange;
  const h = agent.hold, d = E.marginalLot;
  const mu = (k) => {
    const lo = { food: h.food, wood: h.wood, water: h.water }, hi = { food: h.food, wood: h.wood, water: h.water };
    lo[TGOODS[k]] = Math.max(0, lo[TGOODS[k]] - d);
    hi[TGOODS[k]] += d;
    return (costWith(agent, world, lo) - costWith(agent, world, hi)) / (hi[TGOODS[k]] - lo[TGOODS[k]]);
  };
  const muF = Math.max(0, mu(0)) + E.hoursBaseline / c[0];
  const muW = Math.max(0, mu(1)) + E.hoursBaseline / c[1];
  return muW / muF;
}

// Its estimate of another's limit (ODD §7.2): from the particular other if it has traded
// with it before, else from cost norms (the generalized other: others' rates).
function estRatio(agent, other) {
  const t = agent.ties.get(other.id);
  if (t && t.ratio) return t.ratio;
  const N = agent.norm;
  const rf = N.n[A_FORAGE] ? N.eff[A_FORAGE] : agent.rate(A_FORAGE);
  const rw = N.n[A_WOOD] ? N.eff[A_WOOD] : agent.rate(A_WOOD);
  return rf / rw;
}

// What the agent's day ends at with `hold` instead of its current holdings (lower = better).
function costWith(agent, world, hold, belonging) {
  return holdingsCost(agent, world, hold, agent.shelter, agent.busy, agent.drank,
    belonging == null ? agent.need.belonging : belonging, false);
}

// ── gifts ──────────────────────────────────────────────────────────────────────────────
// Units of good k the agent lacks for tonight (food to its set point; wood for one fire).
function shortfall(agent, k) {
  const N = PARAMETERS.needs, G = PARAMETERS.goods;
  if (k === 0) {
    const tonight = agent.need.food - N.foodDecay - N.workBurn * agent.busy;
    return Math.max(0, (1 - tonight) / G.food.restores - agent.hold.food);
  }
  return Math.max(0, G.fireWood - agent.hold.wood);
}

function giftsAt(world, here) {
  const E = PARAMETERS.exchange;
  for (let k = 0; k < 2; k++) {
    const g = TGOODS[k];
    for (const j of here) {
      let need = shortfall(j, k);
      if (need <= 0) continue;
      // givers with a tie to j, strongest first
      const givers = here.filter((i) => i !== j && i.hold[g] > 0 && i.trust(j.id, world.day) > 0);
      givers.sort((x, y) => y.trust(j.id, world.day) - x.trust(j.id, world.day));
      for (const i of givers) {
        if (need <= 0) break;
        if (i.owedBy(j.id, world.day) >= E.owedLimit) continue;          // a grudge: unreturned gifts
        const amount = Math.min(need, i.hold[g]);
        const before = costWith(i, world, i.hold);
        const after = i.hold[g] - amount;
        const hold2 = { food: i.hold.food, wood: i.hold.wood, water: i.hold.water };
        hold2[g] = after;
        const cAfter = costWith(i, world, hold2, i.belongingIfGave(j.id, world.day));
        if (cAfter >= before) continue;                                   // giving must pay the giver
        i.hold[g] = after;
        j.hold[g] += amount;
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
  const scar = TGOODS.map((g, k) => {
    let wanted = 0, held = 0;
    for (const a of here) { wanted += shortfall(a, k); held += a.hold[g]; }
    return held > 0 ? wanted / held : (wanted > 0 ? Infinity : 0);
  });
  const rounds = [0, 1].sort((x, y) => scar[y] - scar[x] || world.rng() - 0.5);
  for (const k of rounds) {
    const holders = shuffleInPlace(here.filter((a) => a.hold[TGOODS[k]] > 0), world.rng);
    const done = new Set();
    for (const i of holders) {
      // i offers good k; candidates hold the other good. Pick the deal best for i.
      let best = null;
      for (const j of here) {
        if (j === i || done.has(j.id + ':' + i.id) || !(j.hold[TGOODS[1 - k]] > 0)) continue;
        const deal = priceFor(world, i, j, k);
        if (!deal) continue;
        const gain = lotGain(world, i, j, k, deal.p, deal.lot).gi;
        if (gain > 0 && (!best || gain > best.gain)) best = { j, deal, gain };
      }
      if (!best) continue;
      done.add(i.id + ':' + best.j.id);
      trade(world, hex, i, best.j, k, best.deal);
    }
  }
}

// Bid rule (ODD §7.2). `seller` gives good k. Returns the price (food per wood) and a lot
// size, or null if the hour-cost guard fails.
function priceFor(world, seller, buyer, k) {
  const woodSeller = k === 1 ? seller : buyer, foodSeller = k === 1 ? buyer : seller;
  const vS = ownRatio(woodSeller, world), vB = ownRatio(foodSeller, world);
  if (!(vB > vS)) return null;                                  // no gains from trade by hours
  const bidS = bidFor(woodSeller, foodSeller, vS, true);
  const bidB = bidFor(foodSeller, woodSeller, vB, false);
  const p = Math.sqrt(bidS * bidB);
  if (!(p >= vS && p <= vB)) return null;                       // walk-away guard, by hours
  const lot = k === 1 ? Math.max(1, 0.1 * seller.hold.wood) : Math.max(1, 0.1 * seller.hold.food / p);
  return { p, lot, fairS: Math.sqrt(vS * estRatio(woodSeller, foodSeller)), fairB: Math.sqrt(vB * estRatio(foodSeller, woodSeller)) };
}

// One side's bid: the better for it of its fair middle and the going rate. The wood seller
// wants a high price, the food seller (wood buyer) a low one.
function bidFor(a, other, v, sellsWood) {
  const fair = Math.sqrt(v * estRatio(a, other));
  if (!a.price.n) return fair;
  const going = Math.exp(a.price.logp);
  return sellsWood ? Math.max(fair, going) : Math.min(fair, going);
}

// Change in each side's cost from one lot (`lot` units of wood) at price p; positive = gain.
function lotGain(world, i, j, k, p, lot) {
  const woodSeller = k === 1 ? i : j, foodSeller = k === 1 ? j : i;
  const w = Math.min(lot, woodSeller.hold.wood, foodSeller.hold.food / p);
  if (!(w > 1e-6)) return { gi: -1, gj: -1, w: 0 };
  const ws = woodSeller.hold, fs = foodSeller.hold;
  const dS = costWith(woodSeller, world, ws) - costWith(woodSeller, world, { food: ws.food + w * p, wood: ws.wood - w, water: ws.water });
  const dB = costWith(foodSeller, world, fs) - costWith(foodSeller, world, { food: fs.food - w * p, wood: fs.wood + w, water: fs.water });
  return k === 1 ? { gi: dS, gj: dB, w } : { gi: dB, gj: dS, w };
}

// Trade lot by lot while both still gain by their own need (walk-away guard), then record
// the price and the kindness each side judges it received.
function trade(world, hex, i, j, k, deal) {
  const E = PARAMETERS.exchange;
  const woodSeller = k === 1 ? i : j, foodSeller = k === 1 ? j : i;
  let wood = 0;
  for (let n = 0; n < E.maxLots; n++) {
    const g = lotGain(world, i, j, k, deal.p, deal.lot);
    if (!(g.gi > 0 && g.gj > 0)) break;
    woodSeller.hold.wood -= g.w; woodSeller.hold.food += g.w * deal.p;
    foodSeller.hold.food -= g.w * deal.p; foodSeller.hold.wood += g.w;
    wood += g.w;
  }
  if (wood <= 0) return;
  i.tradedToday = j.tradedToday = true;
  world.tradesToday.push({ hex, p: deal.p, wood, seller: woodSeller.id, buyer: foodSeller.id,
    // the model knows true limits; log each side's estimate error (ODD §7.2 measurement)
    errS: Math.log(estRatio(woodSeller, foodSeller) / ownRatio(foodSeller, world)),
    errB: Math.log(estRatio(foodSeller, woodSeller) / ownRatio(woodSeller, world)) });
  // kindness, judged against each side's own fair middle (ODD §2 Ties)
  woodSeller.traded(foodSeller.id, world.day, deal.p >= deal.fairS, deal.p);
  foodSeller.traded(woodSeller.id, world.day, deal.p <= deal.fairB, deal.p);
}
