'use strict';
// One individual (ODD §2 Agents). Holds state only; the Observer draws it.
//
// Needs, holdings, a bed in a dwelling (world.dwellings, shared, chosen each evening),
// learned values (habit, norm and which pays off, ODD §4.4), chat, ties, know-how, fields,
// aging and death.
//
// Needs are levels with set point 1 (ODD §2 Needs). Food and water are stocks that run down
// each day and are refilled by consuming; they can fall below 0 (a hunger or thirst debt on
// the body's reserve), so a starving agent still gains from a small meal. Warmth and rest are
// worked out fresh each evening from shelter, fire and free hours, in [0, 1]. The cost of a
// need is its deficit squared (convex: whatever is most lacking dominates; no weights), with
// the level below zero measured as the way to death (needLevel). Death comes when the reserve
// is gone, or after too many evenings at zero warmth.

var A_FORAGE = 0, A_WOOD = 1, A_DRINK = 2, A_BUILD = 3, A_SCOUT = 4, A_QUARRY = 5, A_CRAFT = 6,
  A_DIG = 7, A_TINKER = 8, A_SOW = 9, A_REAP = 10;
var ACT_NAMES = ['forage', 'wood', 'drink', 'build', 'scout', 'quarry', 'craft', 'dig', 'tinker', 'sow', 'reap'];
var ACT_RES = ['plants', 'wood', 'water', null, null, 'flint', null, 'clay', null, 'soil', null];   // resource each activity draws on
var GATHER = [A_FORAGE, A_WOOD, A_QUARRY, A_DIG];                                     // activities that take from a hex
var GOOD_OF = ['food', 'wood', null, null, null, 'flint', null, 'clay', null, null, 'grain'];   // the good each gathering yields
var IS_GATHER = ACT_NAMES.map((n, k) => GATHER.indexOf(k) >= 0);

// ── need levels (ODD §2 Needs: below zero, the scale runs to death; Chris, 2026-11-03) ──
// A need on the cost scale: above zero the level itself; below zero the share of the way to
// death, so -1 is the night the need kills, the same for every need. Food and water owe a
// debt on the body's reserve, the daily need for the days it takes to kill; warmth, not a
// stock, counts `coldDays`, the evenings already spent at zero before this one.
function needReserve(k) {
  const N = PARAMETERS.needs, D = PARAMETERS.agents.deathDays;
  return D[k] * (k === 'food' ? N.foodDecay : N.waterDecay);
}
function needLevel(k, x, coldDays) {
  if (k === 'warmth') return x > 0 ? x : -Math.min(1, (coldDays || 0) / PARAMETERS.agents.deathDays.warmth);
  return x >= 0 ? x : Math.max(-1, x / needReserve(k));
}

// ── shelter (ODD §2 v0 shelter ladder; §7.6 partial projects) ───────────────────────────
// A dwelling: for each build its progress or condition in [0, 1], and whether the hut has been
// finished. A lean-to warms in proportion to its condition; a hut warms only once finished,
// and its condition then wears; an unfinished hut weathers away. A dwelling is a thing in the
// world at its hex (ODD §5 Moving camp, Decided): it stays when its sleepers leave, and anyone
// may sleep in it while it has room; `sleepers` are the ids of those sleeping in it.
function newShelter(hex) { return { hex: hex == null ? -1 : hex, sleepers: [], leanTo: 0, hut: 0, hutDone: false }; }
function shelterIns(sh) {
  const G = PARAMETERS.goods;
  return Math.max(G.leanTo.insulation * sh.leanTo, sh.hutDone ? G.hut.insulation * sh.hut : 0);
}
// Put `hours` of work into build `b` from the inputs in `hold` (used in proportion to the work).
// The build's tool, if held, multiplies the work (ODD §2 Tools: a multiplier on production)
// and wears by the hour. Returns the progress added. The same work repairs a finished structure.
function buildWork(sh, hold, b, hours) {
  const B = BUILDS[b];
  const tool = B.tool && hold[B.tool] > 0 ? B.tool : null, mult = tool ? TOOLS[tool].mult : 1;
  let can = Math.min(hours * mult / B.hours, 1 - sh[b]);
  for (const g in B.inputs) can = Math.min(can, (hold[g] || 0) / B.inputs[g]);
  if (!(can > 1e-9)) return 0;
  for (const g in B.inputs) hold[g] -= can * B.inputs[g];
  if (tool) hold[tool] = Math.max(0, hold[tool] - can * B.hours / mult / TOOLS[tool].life);
  sh[b] += can;
  if (b === 'hut' && sh.hut >= 1 - 1e-9) { sh.hut = 1; sh.hutDone = true; }
  return can;
}
// `days` of weather. Returns true if an unfinished hut weathered away (an abandoned project).
function wearShelter(sh, days) {
  const G = PARAMETERS.goods;
  sh.leanTo = Math.max(0, sh.leanTo - G.leanTo.wear * days);
  if (sh.hut <= 0) return false;
  sh.hut = Math.max(0, sh.hut - (sh.hutDone ? G.hut.wear : G.hut.partWear) * days);
  if (sh.hut > 0) return false;
  const abandoned = !sh.hutDone;
  sh.hutDone = false;   // a finished hut that falls down is gone
  return abandoned;
}

// ── learned values (ODD §4.4, Decided — Chris, 2026-11-03) ──────────────────────────────
// Every value an agent learns has a habit (`h`, from its own experience), a norm (`n`, from
// others': seen, or told in chat), and a record of how far each has missed the agent's own
// experience (`eh`, `en`: running means of the squared miss). The value it plans with (`v`)
// blends the two by the inverse of those misses; beyond `arbExtreme` one source alone is
// used. Before any experience of its own it uses the norm; before the misses exist, the two
// count equally. `nh` and `nn` count experiences and observations.
function newLearned(prior) { return { h: prior, n: 0, nh: 0, nn: 0, eh: -1, en: -1, v: prior }; }
function learnOwn(L, x, rate) {
  const q = PARAMETERS.agents.arbRate;
  if (L.nh > 0) { const m = (x - L.h) * (x - L.h); L.eh = L.eh < 0 ? m : L.eh + q * (m - L.eh); }
  if (L.nn > 0) { const m = (x - L.n) * (x - L.n); L.en = L.en < 0 ? m : L.en + q * (m - L.en); }
  L.h += rate * (x - L.h);
  L.nh++;
  blendLearned(L);
}
function learnNorm(L, y, rate) {
  L.n = L.nn === 0 ? y : L.n + rate * (y - L.n);
  L.nn++;
  blendLearned(L);
}
function blendLearned(L) {
  if (L.nn === 0) { L.v = L.h; return; }
  if (L.nh === 0) { L.v = L.n; return; }
  let w = 0.5;   // weight on the habit
  if (L.eh >= 0 && L.en >= 0) { const ph = 1 / (L.eh + 1e-12), pn = 1 / (L.en + 1e-12); w = ph / (ph + pn); }
  const X = PARAMETERS.agents.arbExtreme;
  if (w > X) w = 1; else if (w < 1 - X) w = 0;
  L.v = w * L.h + (1 - w) * L.n;
}
// the seasonal values a speaker tells in chat (what a day has brought it, by season)
var FLOW_KEYS = ['food', 'wood', 'xfood', 'xwood'];

var Agent = class Agent {
  constructor(id, home, world) {
    const A = PARAMETERS.agents;
    this.id = id;
    this.home = home;
    this.alive = true;
    this.ageDays = A.startAgeYears * PARAMETERS.year.days;
    this.need = { food: 1, water: 1, warmth: 1, rest: 1, belonging: 1 };
    // holdings: food (raw wild plants), wood, water carried in a gourd
    this.hold = { food: A.starterFood, wood: 0, water: 0, flint: 0, axe: 0, pick: 0, clay: 0, pot: 0, grain: 0, hoe: 0, sickle: 0 };   // starterFood is a burn-in scaffold (ODD §5)
    this.shelter = world.dwellings ? world.newDwelling(home, id) : newShelter(home);   // structures at home
    // know-how (ODD §7.3): recipes and builds it can make. Starts with stone and fire (ODD §5);
    // grows by tinkering and by seeing others practise; kept for life, so a craft is lost
    // when everyone who knows it dies without anyone having seen them practise it
    this.knows = new Set(START_KNOWHOW);
    this.practised = [];       // what it made or built today, and where (others can see it)
    // tinkering, learned (ODD §4.4): discoveries per hour per material at hand, as counts
    this.tinker = { found: 0, mh: 0 };
    // projects (ODD §7.6): finished and abandoned, the learned risk of not finishing
    this.projects = { done: 0, abandoned: 0 };
    // farming (Stage 5d): its fields this year, and the grain it has learned comes back to it
    // per seed sown at full fertility, by its own reaping or by gifts from those who reaped
    // its fields (ODD §2, Chris: what returns through others counts)
    this.fields = [];
    this.farmL = newLearned(PARAMETERS.goods.grain.prior);   // read as farmReturn
    // the best land near home it could farm (fertility of its cap), for the projection's sowing
    this.farmFert = 0;
    this.coldDays = 0;   // evenings in a row at zero warmth
    // learned values (ODD §4.4): habit, norm and which pays off, for each
    // the yield: for each gathering activity, how much it gets per hour from a full hex
    // (indexed by activity; only the gathering activities are used)
    this.yld = ACT_NAMES.map((nm) => newLearned(A.priorPerHour[nm] || 0));
    // what a day actually brings in, by season (spring..winter): what the Keep projection
    // lives on (ODD §7.6: expected future need from seasonal norms). Food and wood gathered
    // (wood bare-handed, so a tool's share is known from the recipe), and the net gained or
    // lost in exchange. The prior is the old assumption: a few hours of gathering at the
    // prior rates.
    this.flow = [0, 1, 2, 3].map(() => ({
      food: newLearned(A.projHours.forage * A.priorPerHour.forage), wood: newLearned(A.projHours.wood * A.priorPerHour.wood),
      xfood: newLearned(0), xwood: newLearned(0),
    }));
    this.got = { food: 0, wood: 0 };
    this.xnet = { food: 0, wood: 0 };
    this.livedFood = [1, 1, 1, 1].map(newLearned);   // its usual evening food level, by season
    this.si = 0;               // season of its day, for learning
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
    this.price = {};           // pair key 'a|b' → { logp, n }: units of a per unit of b
    this.tradeRel = 0;
    this.costs = null;
    this.need.belonging = 0;   // no ties yet
    // what it has seen (ODD §4.4: passive, where it is): which hexes, and how full of plants
    // and wood each looked on the day it last saw it
    const n = world.grid.n;
    this.known = new Uint8Array(n);
    this.seenFrac = [];
    for (const g of GATHER) this.seenFrac[g] = new Float32Array(n);
    this.seenDay = new Int32Array(n);
    this.seenGrain = new Float32Array(n);   // ripe grain standing in fields, as last seen
    for (const h of world.grid.within(home, A.sight)) this.look(world, h);
    this.plan = [];            // today's stops [{hex, act, hours}]
    this.obs = [];             // today's observations, applied in the Learn phase
    this.busy = 0;             // hours travelled + worked today
    this.log = { forageHours: 0, forageTravel: 0 };
    this.walked = 0;           // hours walked moving camp this morning (ODD §5 Moving camp)
    this.settle(world, home);
    // its usual hours of work by season apart from drinking and from building, crafting and
    // tinkering (the Keep projection's day)
    const base = A.projHours.forage + A.projHours.wood;
    this.busyHabit = [base, base, base, base].map(newLearned);
  }

  // What depends on where home is: the round trip to the nearest place it can drink, and the
  // best land near home it could farm. Set at birth and when its camp moves.
  settle(world, home) {
    const A = PARAMETERS.agents;
    this.home = home;
    const tr = world.travel(home);
    let trip = Infinity;
    for (let h = 0; h < world.grid.n; h++) if (world.waterAt[h] >= 0 && 2 * tr[h] < trip) trip = 2 * tr[h];
    this.drinkTrip = trip + A.drinkHours;
    this.farmFert = 0;
    for (const h of world.grid.within(home, 2)) if (world.canFarm(h)) this.farmFert = Math.max(this.farmFert, Math.min(1, world.caps.soil[h] / PARAMETERS.goods.grain.soilFull));
  }

  // chance the agent puts on finishing a project: finished / (finished + abandoned), with a
  // hopeful prior (ODD §7.6: the risk of not finishing, learned)
  pFinish() {
    const P = this.projects, k = PARAMETERS.agents.projectPrior;
    return (P.done + k) / (P.done + P.abandoned + k);
  }

  // hours of work and travel the agent can put in today (old age declines, ODD §2)
  capacity() {
    const A = PARAMETERS.agents, years = this.ageDays / PARAMETERS.year.days;
    const f = clamp(1 - (years - A.oldAge.declineStart) / A.oldAge.declineSpan, A.oldAge.floor, 1);
    return A.wakingHours * f - this.walked;   // a morning spent moving camp is gone
  }

  // ── Travel and work: walk the plan, gather, drink, build, look around ─────────────────
  act(world) {
    const A = PARAMETERS.agents, G = PARAMETERS.goods;
    let at = this.home, hours = 0;
    this.drank = false;
    this.places = [this.home];   // where it was today (home in the evening too)
    this.log.forageHours = 0; this.log.forageTravel = 0;
    this.practised = [];
    this.got = { food: 0, wood: 0 };
    this.si = world.seasonIndex;
    let made = 0;              // hours at home making, building or tinkering
    for (const s of this.plan) {
      const leg = world.travel(at)[s.hex];
      hours += leg;
      at = s.hex;
      this.places.push(s.hex);
      this.see(world, s.hex);
      if (IS_GATHER[s.act]) {
        const res = ACT_RES[s.act], cap = world.caps[res][s.hex];
        const frac = cap > 0 ? world.stock[res][s.hex] / cap : 0;
        // a tool for the task multiplies the yield and wears by the hour (ODD §2 Tools)
        const tool = TOOL_FOR[s.act], mult = tool && this.hold[tool] > 0 ? TOOLS[tool].mult : 1;
        const got = world.take(res, s.hex, G[res].perHour * frac * mult * s.hours);
        if (mult > 1) this.hold[tool] = Math.max(0, this.hold[tool] - s.hours / TOOLS[tool].life);
        this.hold[GOOD_OF[s.act]] += got;
        if (s.act === A_FORAGE) {
          // wild cereals on the plains in summer: part of what is gathered there is grain (5d)
          const wg = world.terrain[s.hex] === T_PLAINS && world.seasonIndex === 1 ? got * G.grain.wildShare : 0;
          this.hold.food -= wg; this.hold.grain += wg;
          this.got.food += got - wg;
        } else if (s.act === A_WOOD) this.got.wood += got / mult;
        // what it learns is the bare-handed rate (the tool's share is known from the recipe)
        this.obs.push({ act: s.act, hex: s.hex, perHour: got / s.hours / mult, frac, season: world.seasonIndex });
        this.look(world, s.hex);   // sees what it left behind
        if (s.act === A_FORAGE) { this.log.forageHours += s.hours; this.log.forageTravel = Math.max(this.log.forageTravel, world.travel(this.home)[s.hex]); }
      } else if (s.act === A_DRINK) {
        const src = world.waterAt[s.hex];   // the hex itself, or the river or lake beside it
        if (src >= 0 && world.stock.water[src] > 0) {
          world.take('water', src, PARAMETERS.goods.drinkDraw);
          this.drank = true;
          this.hold.water = Math.max(this.hold.water, waterCarried(this.hold));
        }
      } else if (s.act === A_CRAFT) {
        // make a good at home from inputs in hand (ODD §2 First tree v0)
        const R = RECIPES[s.recipe];
        if (this.knows.has(s.recipe) && Object.keys(R.inputs).every((g) => this.hold[g] >= R.inputs[g])) {
          for (const g in R.inputs) this.hold[g] -= R.inputs[g];
          this.hold[s.recipe] += 1;
          this.practised.push({ hex: s.hex, what: s.recipe });
          world.crafted = (world.crafted || 0) + 1;
          world.made[s.recipe] = (world.made[s.recipe] || 0) + 1;
        }
        made += s.hours;
      } else if (s.act === A_BUILD) {
        // work on a structure at home; a hut may take several days (ODD §7.6 partial projects)
        const wasDone = this.shelter.hutDone, before = this.shelter[s.build];
        if (this.knows.has(s.build) && buildWork(this.shelter, this.hold, s.build, s.hours) > 0) {
          this.practised.push({ hex: s.hex, what: s.build });
          if (s.build === 'hut') {
            if (before === 0) world.hutsStarted = (world.hutsStarted || 0) + 1;
            if (!wasDone && this.shelter.hutDone) { this.projects.done++; world.hutsFinished = (world.hutsFinished || 0) + 1; }
          }
        }
        made += s.hours;
      } else if (s.act === A_TINKER) {
        this.tinkerAt(world, s.hex, s.hours);
        made += s.hours;
      } else if (s.act === A_SOW) {
        // sow grain in a field (ODD §7.6 v0 food level 2); the hoe multiplies the work
        const mult = this.hold.hoe > 0 ? TOOLS.hoe.mult : 1;
        const seeds = Math.min(this.hold.grain, s.hours * G.grain.sowPerHour * mult);
        if (this.knows.has('farm') && seeds > 1e-6 && world.canSow(s.hex)) {
          this.hold.grain -= seeds;
          if (mult > 1) this.hold.hoe = Math.max(0, this.hold.hoe - s.hours / TOOLS.hoe.life);
          world.sow(this, s.hex, seeds);
          this.practised.push({ hex: s.hex, what: 'farm' });
        }
      } else if (s.act === A_REAP) {
        // reap ripe grain from any field in the hex, its own first (anyone may harvest, ODD §2)
        const mult = this.hold.sickle > 0 ? TOOLS.sickle.mult : 1;
        const got = world.reap(this, s.hex, s.hours * G.grain.reapPerHour * mult);
        if (mult > 1 && got > 0) this.hold.sickle = Math.max(0, this.hold.sickle - s.hours / TOOLS.sickle.life);
        this.hold.grain += got;
        this.look(world, s.hex);
      }
      hours += s.hours;
    }
    if (this.plan.length) hours += world.travel(at)[this.home];
    this.busy = hours;
    // its usual working day, apart from drinking and making (learned by season, ODD §4.4)
    const routine = Math.max(0, hours - made - (this.drank ? this.drinkTrip : 0));
    const si = world.seasonIndex;
    learnOwn(this.busyHabit[si], routine, PARAMETERS.agents.flowRate);   // as the other seasonal habits
  }

  // Tinkering (ODD §7.3): an undiscovered level can be found only with all its inputs at hand,
  // in the agent's holdings or the hex's resources, and its tool held. Each hour gives each
  // such level a small chance. The agent learns how often tinkering pays, per material.
  tinkerAt(world, hex, hours) {
    const at = materialsAt(this, world, hex, this.hold, true);
    let found = 0;
    for (const r in DISCOVERABLE) {
      if (this.knows.has(r)) continue;
      const D = DISCOVERABLE[r];
      if (!D.needs.every((g) => at.has(g)) || (D.tool && !(this.hold[D.tool] > 0))) continue;
      if (world.rng() < 1 - Math.pow(1 - PARAMETERS.agents.discoverPerHour, hours)) {
        this.knows.add(r);
        found++;
        world.discoveries.push({ day: world.day, id: this.id, what: r });
      }
    }
    this.tinker.found += found;
    this.tinker.mh += hours * at.size;
    world.tinkerHours = (world.tinkerHours || 0) + hours;
  }

  // A field of its own has closed: what came back per seed, at full fertility (ODD §2: its
  // own reaping and grain gifted by those who reaped it), by one error-driven update.
  learnFarm(perSeed) { learnOwn(this.farmL, perSeed, PARAMETERS.agents.learnRate); }
  get farmReturn() { return this.farmL.v; }
  // grain it expects back from fields it has sown and that have not ripened yet
  // (fields beyond half a day's reach of home bring nothing back, ODD §5 Moving camp)
  pendingGrain(world) {
    const tr = world.travel(this.home), reach = this.capacity() / 2;
    let g = 0;
    for (const f of this.fields) if (!f.ripe && tr[f.hex] <= reach) g += f.seeds * f.fert * this.farmReturn;
    return g;
  }

  // what it learns by seeing others practise (ODD §7.3); called from the meeting phase
  seePractice(world, other, hex) {
    for (const p of other.practised) {
      if (p.hex !== hex || this.knows.has(p.what)) continue;
      if (world.rng() < PARAMETERS.agents.seeLearn) {
        this.knows.add(p.what);
        world.learnedBySeeing.push({ day: world.day, id: this.id, from: other.id, what: p.what });
      }
    }
  }

  // standing in a hex, it sees that hex and its neighbours
  see(world, hex) {
    for (const h of world.grid.within(hex, 1)) this.look(world, h);
  }

  look(world, h) {
    this.known[h] = 1;
    this.seenDay[h] = world.day;
    for (const k of GATHER) {
      const res = ACT_RES[k], cap = world.caps[res][h];
      this.seenFrac[k][h] = cap > 0 ? world.stock[res][h] / cap : 0;
    }
    this.seenGrain[h] = world.grainHex[h];
  }

  // ── Consume: the evening at home ─────────────────────────────────────────────────────
  consume(world) {
    const out = Agent.evening(this.need, this.hold, shelterIns(this.shelter), this.busy, this.drank,
      world.season().cold, this.capacity());
    this.need.food = Math.max(-needReserve('food'), out.food);
    this.need.water = Math.max(-needReserve('water'), out.water);
    this.need.warmth = out.warmth; this.need.rest = out.rest;
    this.hold.food = out.hold.food * (1 - PARAMETERS.goods.food.rot);   // raw plants rot
    this.hold.wood = out.hold.wood;
    this.hold.water = out.hold.water;
    this.hold.grain = out.hold.grain * (1 - PARAMETERS.goods.grain.rot);   // grain keeps
    if (this.hold.pot > 0) this.hold.pot = Math.max(0, this.hold.pot - PARAMETERS.goods.pot.wear);   // pots break
    // a dwelling weathers once a day however many sleep in it (the first sleeper's evening);
    // a part-built hut that falls is an abandoned project for each of them
    const sh = this.shelter;
    if ((!sh.sleepers.length || sh.sleepers[0] === this.id) && wearShelter(sh, 1)) {
      for (const id of sh.sleepers.length ? sh.sleepers : [this.id]) {
        const s = id === this.id ? this : world.agents.find((x) => x.id === id);
        if (s) s.projects.abandoned++;
      }
    }
    this.coldDays = this.need.warmth <= 0 ? this.coldDays + 1 : 0;
    this.need.belonging = this.belonging(world.day);
    this.walked = 0;
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
  // belonging from its ties to `others` alone (the ties it would keep camping with them)
  belongingWith(others, day) {
    let s = 0;
    for (const o of others) if (o !== this && this.ties.has(o.id)) { const t = this.tie(o.id, day); s += Math.min(t.kind, t.given); }
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
  // `key` names the pair ('a|b'), `p` is units of a per unit of b; the particular other's
  // price for that pair is remembered as its model of that agent.
  traded(id, day, kind, key, p) {
    const E = PARAMETERS.exchange, t = this.tie(id, day);
    t.kind += kind ? 1 : E.tradeWeight;
    t.given += E.tradeWeight;
    t.n++;
    if (!t.ratio) t.ratio = {};
    t.ratio[key] = t.ratio[key] ? Math.exp(Math.log(t.ratio[key]) + 0.3 * (Math.log(p) - Math.log(t.ratio[key]))) : p;
    this.observePrice(key, p);
  }
  observePrice(key, p) {
    let P = this.price[key];
    if (!P) P = this.price[key] = { logp: Math.log(p), n: 0 };
    else P.logp += PARAMETERS.exchange.priceRate * (Math.log(p) - P.logp);
    P.n++;
  }

  // One evening, as a pure function (the planner calls it too). Needs run down by the
  // day's decay and the work done, then the agent drinks, lights a fire if it has the wood,
  // eats (cooked food restores more, ODD §4.5) and warms itself (shelter base + fire,
  // ODD §2 Warmth; `ins` is the shelter's insulation). Returns the new levels and what is left. Food and water are NOT floored
  // here; consume() floors the stored levels at the reserve (death).
  // `days` > 1 lumps several days into one step (the planner's long Keep projection): the
  // needs run down and the fire burns for that many days, and eating can make it all up.
  static evening(need, hold, ins, busy, drank, cold, capacity, days) {
    const N = PARAMETERS.needs, G = PARAMETERS.goods;
    days = days || 1;
    let food = need.food - days * (N.foodDecay + N.workBurn * busy);
    let water = drank ? 1 : need.water - days * N.waterDecay;
    let hf = hold.food, hw = hold.wood, hwat = hold.water, hg = hold.grain || 0;
    // drink from the gourd
    if (water < 1 && hwat > 0) { const d = Math.min(hwat, 1 - water); water += d; hwat -= d; }
    // fire: lit whenever there is the wood (cooking and warmth); over several days, on as many
    // of them as the wood allows (a share, so the projection has no all-or-nothing week)
    const fire = days > 1 ? Math.min(1, hw / (G.fireWood * days)) : (hw >= G.fireWood ? 1 : 0);
    hw -= fire * G.fireWood * days;
    const per = G.food.restores * (1 + fire * (G.food.cookedBonus - 1));
    if (food < 1 && hf > 0) { const eat = Math.min(hf, (1 - food) / per); food += eat * per; hf -= eat; }
    // then grain, which keeps (Stage 5d): better food, and better still cooked in a pot
    const perG = G.grain.restores * (hold.pot > 0 ? 1 + fire * (G.grain.cookedBonus - 1) : 1);
    if (food < 1 && hg > 0) { const eat = Math.min(hg, (1 - food) / perG); food += eat * perG; hg -= eat; }
    let warmth = 1 - cold * (1 - ins) + fire * G.fireHeat;
    const free = capacity - busy;
    const rest = clamp(free / N.restSet, 0, 1);
    return {
      food: Math.min(food, 1), water: Math.min(water, 1), warmth: clamp(warmth, 0, 1), rest,
      hold: Object.assign({}, hold, { food: hf, wood: hw, water: hwat, grain: hg }),
    };
  }

  // ── Learn: habits from its own day (ODD §4.4, one error-driven update) ─────────────────
  // one error-driven update of the yield per hour from a full hex, from what it got and how
  // full the hex was (a nearly bare hex says little about the rate, so it is skipped); and a
  // slower one of what the day brought in, for the season
  learn() {
    const A = PARAMETERS.agents, F = this.flow[this.si], r = A.flowRate;
    learnOwn(F.food, this.got.food, r);
    learnOwn(F.wood, this.got.wood, r);
    learnOwn(F.xfood, this.xnet.food, r);
    learnOwn(F.xwood, this.xnet.wood, r);
    learnOwn(this.livedFood[this.si], this.need.food, r);
    for (const o of this.obs) if (o.frac > 0.05) learnOwn(this.yld[o.act], o.perHour / o.frac, A.learnRate);
    this.obs = [];
  }

  // Norms: one error-driven update from someone else's experience, seen or told (ODD §4.4).
  observe(o) {
    if (!(o.frac > 0.05)) return;
    learnNorm(this.yld[o.act], o.perHour / o.frac, PARAMETERS.agents.normRate);
  }
  // Told in chat (ODD §4.4): what a day has brought the speaker in each season, its usual
  // evening food and working day, and its return on sowing; only what it has lived. Told
  // values move the norm at the seasonal habits' rate (Chris, 2026-11-03), so the norm is
  // not just the last few speakers.
  hear(b) {
    const r = PARAMETERS.agents.flowRate;
    for (let si = 0; si < 4; si++) {
      const F = this.flow[si], G = b.flow[si];
      for (const k of FLOW_KEYS) if (G[k].nh > 0) learnNorm(F[k], G[k].h, r);
      if (b.livedFood[si].nh > 0) learnNorm(this.livedFood[si], b.livedFood[si].h, r);
      if (b.busyHabit[si].nh > 0) learnNorm(this.busyHabit[si], b.busyHabit[si].h, r);
    }
    if (b.farmL.nh > 0) learnNorm(this.farmL, b.farmL.h, r);
  }

  // the yield it plans with: habit and norm blended by which has paid off (ODD §4.4)
  rate(act) { return this.yld[act].v; }

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
      for (const key in b.price) this.observePrice(key, Math.exp(b.price[key].logp));
      this.hear(b);
      for (const o of b.obs) {
        this.observe(o);
        const h = o.hex;
        if (!this.known[h] || b.seenDay[h] > this.seenDay[h]) {
          if (!this.known[h]) this.heard++;
          this.known[h] = 1;
          this.seenDay[h] = b.seenDay[h];
          for (const g of GATHER) this.seenFrac[g][h] = b.seenFrac[g][h];
          this.seenGrain[h] = b.seenGrain[h];   // ripe grain standing there, as told
        }
      }
    }
  }

  // a need on the cost scale tonight (ODD §2 Needs), for reports
  level(k) { return needLevel(k, this.need[k], this.coldDays - 1); }

  // ── Aging and death ──────────────────────────────────────────────────────────────────
  age(world) {
    const A = PARAMETERS.agents, D = A.deathDays;
    this.ageDays++;
    const years = this.ageDays / PARAMETERS.year.days;
    const hazard = A.oldAge.gompertzA * Math.exp(A.oldAge.gompertzB * years) / PARAMETERS.year.days;
    let cause = null;
    if (this.need.water <= 1e-9 - needReserve('water')) cause = 'thirst';
    else if (this.need.food <= 1e-9 - needReserve('food')) cause = 'hunger';
    else if (this.coldDays > D.warmth) cause = 'cold';
    else if (world.rng() < hazard) cause = 'old age';
    if (cause) { this.alive = false; this.cause = cause; }
  }
};

// Water it can carry home and store (ODD §2 v0 water ladder): a gourd, and a pot if it has one.
function waterCarried(hold) {
  const G = PARAMETERS.goods;
  return G.gourd + (hold.pot > 0 ? G.pot.cap : 0);
}

// The materials at hand at a hex (ODD §7.3): goods held, and the resources there, as the agent
// last saw them (`real` false: the planner's view) or as they are (`real` true).
var RES_GOOD = { plants: 'food', wood: 'wood', clay: 'clay', flint: 'flint' };
function materialsAt(agent, world, hex, hold, real) {
  const at = new Set();
  for (const g of GOODS) if (hold[g] > 0) at.add(g);
  if (world.canFarm(hex)) at.add('soil');   // fertile land (Stage 5d)
  for (const act of GATHER) {
    const res = ACT_RES[act];
    const there = real ? world.stock[res][hex] > 0 : agent.seenFrac[act][hex] > 0.02;
    if (there && RES_GOOD[res]) at.add(RES_GOOD[res]);
  }
  return at;
}
