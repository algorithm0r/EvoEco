'use strict';
// One individual (ODD §2 Agents). Holds state only; the Observer draws it.
//
// Stage 2: needs, holdings, a home with a lean-to, habits learned from its own day, aging
// and death. No exchange, no chat, no ties yet (belonging is held at its set point until
// Stage 4–5 give it something to act on).
//
// Needs are levels with set point 1 (ODD §2 Needs). Food and water are stocks that run down
// each day and are refilled by consuming; they can fall below 0 (a hunger or thirst debt,
// down to -1), so a starving agent still gains from a small meal. Warmth and rest are worked
// out fresh each evening from shelter, fire and free hours, in [0, 1]. The cost of a need is
// its deficit squared (convex: whatever is most lacking dominates; no weights). Death comes
// from days spent at or below 0.

var A_FORAGE = 0, A_WOOD = 1, A_DRINK = 2, A_BUILD = 3, A_SCOUT = 4;
var ACT_NAMES = ['forage', 'wood', 'drink', 'build', 'scout'];
var ACT_RES = ['plants', 'wood', 'water', null, null];   // resource each activity draws on

var Agent = class Agent {
  constructor(id, home, world) {
    const A = PARAMETERS.agents;
    this.id = id;
    this.home = home;
    this.alive = true;
    this.ageDays = A.startAgeYears * PARAMETERS.year.days;
    this.need = { food: 1, water: 1, warmth: 1, rest: 1, belonging: 1 };
    // holdings: food (raw wild plants), wood, water carried in a gourd
    this.hold = { food: A.starterFood, wood: 0, water: 0 };   // starterFood is a burn-in scaffold (ODD §5)
    this.shelter = 0;          // lean-to condition at home, 0..1
    this.zeroDays = { food: 0, water: 0, warmth: 0 };
    // habits (ODD §4.4, own experience only): for each gathering activity, how much it gets
    // per hour from a full hex. Learned by doing.
    this.eff = [A.priorPerHour.forage, A.priorPerHour.wood];
    this.effN = [0, 0];
    // what an hour of foraging and of wood-cutting actually brought, by season (spring..winter):
    // the seasonal habit the Keep projection uses
    this.seasonYield = [[0, 0, 0, 0].map(() => A.priorPerHour.forage), [0, 0, 0, 0].map(() => A.priorPerHour.wood)];
    // norms (ODD §4.4): the same rates, pooled from what it has seen others get and been told
    this.norm = { eff: [0, 0], n: [0, 0] };
    this.met = [];             // agents met today
    this.places = [home];      // where it was today
    this.chatted = 0;          // how many it chatted with today
    this.heard = 0;            // sightings learned from others, all time
    this.metTotal = 0;         // meetings, all time
    // ties (ODD §2): for each other agent it has dealt with, a fading tally of the kind offers
    // it judged it received (trust), a fading tally of those it made, the owing balance in
    // gift occasions (+ = they owe me), and its model of that particular other's price
    this.ties = new Map();
    this.forget = PARAMETERS.exchange.forget;   // its own daily chance of forgetting a debt
    // price norm for food per wood (log, pooled from trades made, seen and told), and how
    // reliably its own trades have come off (ODD §7.6: trade enters the plan)
    this.price = { logp: 0, n: 0 };
    this.tradeRel = 0;
    this.costs = null;
    this.need.belonging = 0;   // no ties yet
    // what it has seen (ODD §4.4: passive, where it is): which hexes, and how full of plants
    // and wood each looked on the day it last saw it
    const n = world.grid.n;
    this.known = new Uint8Array(n);
    this.seenFrac = [new Float32Array(n), new Float32Array(n)];
    this.seenDay = new Int32Array(n);
    for (const h of world.grid.within(home, A.sight)) this.look(world, h);
    this.plan = [];            // today's stops [{hex, act, hours}]
    this.obs = [];             // today's observations, applied in the Learn phase
    this.busy = 0;             // hours travelled + worked today
    this.log = { forageHours: 0, forageTravel: 0 };
  }

  // hours of work and travel the agent can put in today (old age declines, ODD §2)
  capacity() {
    const A = PARAMETERS.agents, years = this.ageDays / PARAMETERS.year.days;
    const f = clamp(1 - (years - A.oldAge.declineStart) / A.oldAge.declineSpan, A.oldAge.floor, 1);
    return A.wakingHours * f;
  }

  // ── Travel and work: walk the plan, gather, drink, build, look around ─────────────────
  act(world) {
    const A = PARAMETERS.agents, G = PARAMETERS.goods;
    let at = this.home, hours = 0;
    this.drank = false;
    this.places = [this.home];   // where it was today (home in the evening too)
    this.log.forageHours = 0; this.log.forageTravel = 0;
    for (const s of this.plan) {
      const leg = world.travel(at)[s.hex];
      hours += leg;
      at = s.hex;
      this.places.push(s.hex);
      this.see(world, s.hex);
      if (s.act === A_FORAGE || s.act === A_WOOD) {
        const res = ACT_RES[s.act], cap = world.caps[res][s.hex];
        const frac = cap > 0 ? world.stock[res][s.hex] / cap : 0;
        const got = world.take(res, s.hex, G[res].perHour * frac * s.hours);
        this.hold[s.act === A_FORAGE ? 'food' : 'wood'] += got;
        this.obs.push({ act: s.act, hex: s.hex, perHour: got / s.hours, frac, season: world.seasonIndex });
        this.look(world, s.hex);   // sees what it left behind
        if (s.act === A_FORAGE) { this.log.forageHours += s.hours; this.log.forageTravel = Math.max(this.log.forageTravel, world.travel(this.home)[s.hex]); }
      } else if (s.act === A_DRINK) {
        const src = world.waterAt[s.hex];   // the hex itself, or the river or lake beside it
        if (src >= 0 && world.stock.water[src] > 0) {
          world.take('water', src, PARAMETERS.goods.drinkDraw);
          this.drank = true;
          this.hold.water = Math.max(this.hold.water, G.gourd);
        }
      } else if (s.act === A_BUILD) {
        // the lean-to takes wood in proportion to the hours put in
        const want = s.hours / G.leanTo.hours;
        const can = Math.min(want, this.hold.wood / G.leanTo.wood, 1 - this.shelter);
        this.hold.wood -= can * G.leanTo.wood;
        this.shelter += can;
      }
      hours += s.hours;
    }
    if (this.plan.length) hours += world.travel(at)[this.home];
    this.busy = hours;
  }

  // standing in a hex, it sees that hex and its neighbours
  see(world, hex) {
    for (const h of world.grid.within(hex, 1)) this.look(world, h);
  }

  look(world, h) {
    this.known[h] = 1;
    this.seenDay[h] = world.day;
    for (let k = 0; k < 2; k++) {
      const res = ACT_RES[k], cap = world.caps[res][h];
      this.seenFrac[k][h] = cap > 0 ? world.stock[res][h] / cap : 0;
    }
  }

  // ── Consume: the evening at home ─────────────────────────────────────────────────────
  consume(world) {
    const out = Agent.evening(this.need, this.hold, this.shelter, this.busy, this.drank,
      world.season().cold, this.capacity());
    this.need.food = Math.max(-1, out.food); this.need.water = Math.max(-1, out.water);
    this.need.warmth = out.warmth; this.need.rest = out.rest;
    this.hold.food = out.hold.food * (1 - PARAMETERS.goods.food.rot);   // raw plants rot
    this.hold.wood = out.hold.wood;
    this.hold.water = out.hold.water;
    this.shelter = Math.max(0, this.shelter - PARAMETERS.goods.leanTo.wear);
    for (const k of ['food', 'water', 'warmth']) this.zeroDays[k] = this.need[k] <= 0 ? this.zeroDays[k] + 1 : 0;
    this.need.belonging = this.belonging(world.day);
  }

  // ── ties (ODD §2 Ties, Owing) ─────────────────────────────────────────────────────────
  // The record for another agent, faded to today: tallies fade with time; the owing balance
  // shrinks at the agent's own forgetting rate (the expected value of its daily chance).
  tie(id, day) {
    let t = this.ties.get(id);
    if (!t) { t = { kind: 0, given: 0, owed: 0, n: 0, ratio: 0, last: day }; this.ties.set(id, t); }
    const dt = day - t.last;
    if (dt > 0) {
      const f = Math.exp(-dt / PARAMETERS.exchange.tallyMemory);
      t.kind *= f; t.given *= f;
      t.owed *= Math.pow(1 - this.forget, dt);
      t.last = day;
    }
    return t;
  }
  trust(id, day) { return this.ties.has(id) ? this.tie(id, day).kind : 0; }
  owedBy(id, day) { return this.ties.has(id) ? this.tie(id, day).owed : 0; }

  // Belonging (ODD §2 Needs): ties in both directions, trusting and being trusted. Each tie
  // counts the smaller of the kindness received and the kindness given.
  belonging(day) {
    let s = 0;
    for (const id of this.ties.keys()) { const t = this.tie(id, day); s += Math.min(t.kind, t.given); }
    return clamp(s / PARAMETERS.exchange.belongingSet, 0, 1);
  }
  belongingIfGave(id, day) {
    const t = this.tie(id, day);
    const d = Math.min(t.kind, t.given + 1) - Math.min(t.kind, t.given);
    return clamp(this.need.belonging + d / PARAMETERS.exchange.belongingSet, 0, 1);
  }
  gave(id, day) { const t = this.tie(id, day); t.given += 1; t.owed += 1; t.n++; }
  received(id, day) { const t = this.tie(id, day); t.kind += 1; t.owed -= 1; t.n++; }
  // A completed barter is mutual gain (weight `tradeWeight`, swept including 0); a price at
  // least as good as its own fair middle counts as a full kind offer.
  traded(id, day, kind, p) {
    const E = PARAMETERS.exchange, t = this.tie(id, day);
    t.kind += kind ? 1 : E.tradeWeight;
    t.given += E.tradeWeight;
    t.n++;
    t.ratio = t.ratio ? Math.exp(Math.log(t.ratio) + 0.3 * (Math.log(p) - Math.log(t.ratio))) : p;
    this.observePrice(p);
  }
  observePrice(p) {
    const P = this.price;
    if (!P.n) P.logp = Math.log(p);
    else P.logp += PARAMETERS.exchange.priceRate * (Math.log(p) - P.logp);
    P.n++;
  }

  // One evening, as a pure function (the planner calls it too). Needs run down by the
  // day's decay and the work done, then the agent drinks, lights a fire if it has the wood,
  // eats (cooked food restores more, ODD §4.5) and warms itself (shelter base + fire,
  // ODD §2 Warmth). Returns the new levels and what is left. Food and water are NOT floored
  // here, so the planner still sees a gain from a meal too small to lift a starving agent
  // above -1; consume() floors the stored levels at -1.
  // `days` > 1 lumps several days into one step (the planner's long Keep projection): the
  // needs run down and the fire burns for that many days, and eating can make it all up.
  static evening(need, hold, shelter, busy, drank, cold, capacity, days) {
    const N = PARAMETERS.needs, G = PARAMETERS.goods;
    days = days || 1;
    let food = need.food - days * (N.foodDecay + N.workBurn * busy);
    let water = drank ? 1 : need.water - days * N.waterDecay;
    let hf = hold.food, hw = hold.wood, hwat = hold.water;
    // drink from the gourd
    if (water < 1 && hwat > 0) { const d = Math.min(hwat, 1 - water); water += d; hwat -= d; }
    // fire: lit whenever there is the wood (cooking and warmth)
    const fire = hw >= G.fireWood * days;
    if (fire) hw -= G.fireWood * days;
    const per = G.food.restores * (fire ? G.food.cookedBonus : 1);
    if (food < 1 && hf > 0) { const eat = Math.min(hf, (1 - food) / per); food += eat * per; hf -= eat; }
    let warmth = 1 - cold * (1 - G.leanTo.insulation * shelter) + (fire ? G.fireHeat : 0);
    const free = capacity - busy;
    const rest = clamp(free / N.restSet, 0, 1);
    return {
      food: Math.min(food, 1), water: Math.min(water, 1), warmth: clamp(warmth, 0, 1), rest,
      hold: { food: hf, wood: hw, water: hwat },
    };
  }

  // ── Learn: habits from its own day (ODD §4.4, one error-driven update) ─────────────────
  // one error-driven update of the yield per hour from a full hex, from what it got and how
  // full the hex was (a nearly bare hex says little about the rate, so it is skipped)
  learn() {
    const A = PARAMETERS.agents;
    for (const o of this.obs) {
      const sy = this.seasonYield[o.act];
      sy[o.season] += A.learnRate * (o.perHour - sy[o.season]);
      if (o.frac > 0.05) {
        this.eff[o.act] += A.learnRate * (o.perHour / o.frac - this.eff[o.act]);
        this.effN[o.act] = Math.min(A.habitCap, this.effN[o.act] + 1);
      }
    }
    this.obs = [];
  }

  // Norms: one error-driven update from someone else's experience, seen or told (ODD §4.4).
  observe(o) {
    if (!(o.frac > 0.05)) return;
    const r = o.perHour / o.frac, N = this.norm;
    if (N.n[o.act] === 0) N.eff[o.act] = r;
    else N.eff[o.act] += PARAMETERS.agents.normRate * (r - N.eff[o.act]);
    N.n[o.act]++;
  }

  // Precision-weighted rate (ODD §4.4 arbitration): the norm as prior, the habit as evidence,
  // each weighted by how much lies behind it.
  rate(act) {
    const A = PARAMETERS.agents;
    const nH = this.effN[act], wN = this.norm.n[act] > 0 ? A.normPrior : 0;
    if (nH + wN === 0) return this.eff[act];
    return (nH * this.eff[act] + wN * this.norm.eff[act]) / (nH + wN);
  }

  // Chat with up to k of the people met today, ties first, the rest at random (ODD §4.6). Each tells where it went and what it got: the listener updates its norms and
  // takes any newer sighting of those hexes (ODD §4.6).
  chat(world) {
    const k = PARAMETERS.agents.chatK;
    // ties first (strongest trust first), then the rest in random order
    const pool = shuffleInPlace(this.met.slice(), world.rng);
    pool.sort((x, y) => this.trust(y.id, world.day) - this.trust(x.id, world.day));
    this.chatted = 0;
    for (let i = 0; i < pool.length && this.chatted < k; i++) {
      const b = pool[i];
      this.chatted++;
      if (b.price.n) this.observePrice(Math.exp(b.price.logp));
      for (const o of b.obs) {
        this.observe(o);
        const h = o.hex;
        if (!this.known[h] || b.seenDay[h] > this.seenDay[h]) {
          if (!this.known[h]) this.heard++;
          this.known[h] = 1;
          this.seenDay[h] = b.seenDay[h];
          this.seenFrac[0][h] = b.seenFrac[0][h];
          this.seenFrac[1][h] = b.seenFrac[1][h];
        }
      }
    }
  }

  // ── Aging and death ──────────────────────────────────────────────────────────────────
  age(world) {
    const A = PARAMETERS.agents, D = A.deathDays;
    this.ageDays++;
    const years = this.ageDays / PARAMETERS.year.days;
    const hazard = A.oldAge.gompertzA * Math.exp(A.oldAge.gompertzB * years) / PARAMETERS.year.days;
    let cause = null;
    if (this.zeroDays.water > D.water) cause = 'thirst';
    else if (this.zeroDays.food > D.food) cause = 'hunger';
    else if (this.zeroDays.warmth > D.warmth) cause = 'cold';
    else if (world.rng() < hazard) cause = 'old age';
    if (cause) { this.alive = false; this.cause = cause; }
  }
};
