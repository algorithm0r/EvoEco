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

var A_GREENS = 0, A_WOOD = 1, A_DRINK = 2, A_BUILD = 3, A_SCOUT = 4, A_QUARRY = 5, A_CRAFT = 6,
  A_DIG = 7, A_TINKER = 8, A_SOW = 9, A_REAP = 10, A_SEEDS = 11, A_ROOTS = 12, A_NUTS = 13, A_PROCESS = 14,
  A_SMALL = 15, A_HUNT = 16;
var ACT_NAMES = ['greens', 'wood', 'drink', 'build', 'scout', 'quarry', 'craft', 'dig', 'tinker', 'sow', 'reap',
  'seeds', 'roots', 'nuts', 'process', 'smallgame', 'hunt', 'snare', 'gourds', 'fibre', 'fetch'];
var A_SNARE = 17;   // tending snares for small game (the hunting ladder's first rung, Stage 5h)
var A_GOURD = 18, A_FIBRE = 19;   // gathering gourd fruit and fibre (the first material tree, Stage 5h)
var A_FETCH = 20;   // taking up goods lying somewhere (ODD §2 Fetching is moving camp in more than one trip)
var ACT_RES = ['greens', 'wood', 'water', null, null, 'flint', null, 'clay', null, 'soil', null,
  'seeds', 'roots', 'nuts', null, 'smallgame', null, null, 'gourds', 'fibre', null];        // resource each activity draws on
// gathering wild food (Stage 5g); small game is taken like a plant, from the hex's density
// (ODD §2 Game, Stage 5h); big game (A_HUNT) is hunted from herds (Agent.hunt)
var FORAGE = [A_GREENS, A_SEEDS, A_ROOTS, A_NUTS, A_SMALL];
var GATHER = FORAGE.concat([A_WOOD, A_QUARRY, A_DIG, A_GOURD, A_FIBRE]);                                // activities that take from a hex
var GOOD_OF = ['greens', 'wood', null, null, null, 'flint', null, 'clay', null, null, 'grain',
  'grain', 'roots', 'nuts', null, 'meat', 'meat', 'meat', 'gourdFruit', 'fibre', null];                            // the good each gathering yields
var IS_GATHER = ACT_NAMES.map((n, k) => GATHER.indexOf(k) >= 0);
var IS_FORAGE = ACT_NAMES.map((n, k) => FORAGE.indexOf(k) >= 0);
// what a look takes in and chat passes on: how full each gathering hex looked, and big game's sign
var SEEN = GATHER.concat([A_HUNT]);
// goods a day brings in by gathering, whose seasonal flows the Keep projection lives on (meat:
// small game, and big game as if bare-handed; Stage 5h)
var FLOW_GOODS = ['greens', 'grain', 'roots', 'nuts', 'meat', 'wood'];
// units an hour of gathering resource `res` takes from a full hex, bare-handed
function gatherRate(res) { const R = PARAMETERS.resources[res]; return R.perHour || PARAMETERS.goods[res].perHour; }
// is resource `res` in its season at year phase `ph` (from–to shares of the year; none: always)?
function resInSeason(res, ph) {
  const S = PARAMETERS.resources[res].season;
  return !Array.isArray(S) || (ph >= S[0] && ph < S[1]);
}
// food one unit of `k` gives tonight: more cooked on a fire (`fire`, a share), grain only in a pot
function foodPer(k, fire, pot) {
  const F = PARAMETERS.goods[k];
  return F.restores * (F.potCook && !pot ? 1 : 1 + fire * (F.cookedBonus - 1));
}

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
  if (!Number.isFinite(x)) return;   // an impossible experience teaches nothing (a NaN once spread by chat to whole camps)
  const q = PARAMETERS.agents.arbRate;
  if (L.nh > 0) { const m = (x - L.h) * (x - L.h); L.eh = L.eh < 0 ? m : L.eh + q * (m - L.eh); }
  if (L.nn > 0) { const m = (x - L.n) * (x - L.n); L.en = L.en < 0 ? m : L.en + q * (m - L.en); }
  L.h += rate * (x - L.h);
  L.nh++;
  blendLearned(L);
}
function learnNorm(L, y, rate) {
  if (!Number.isFinite(y)) return;
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
// the seasonal values a speaker tells in chat (what a day has brought it, by season: gathered,
// and netted in exchange)
// 'l' + good: what its hands could not hold (ODD §2 Containers and carrying: gear's worth)
// 'r' + gear: its return an hour of gathering (food, as if without tools) on days carrying that
// gear or bare-handed, and 'fhours' the hours it gathers a day (ODD §2 Gear is a strategy whose
// efficiency is learned)
var GEAR_FLOWS = ['rbare', 'rbasket', 'rbag', 'fhours'];
var FLOW_KEYS = FLOW_GOODS.concat(FLOW_GOODS.map((g) => 'x' + g), ['game'], FLOW_GOODS.map((g) => 'l' + g), GEAR_FLOWS);

var Agent = class Agent {
  // `opts.born`: a newborn (Stage 6), with nothing held and no shelter of its own
  constructor(id, home, world, opts) {
    const A = PARAMETERS.agents, born = !!(opts && opts.born);
    this.id = id;
    this.home = home;
    this.alive = true;
    // adults of mixed age and both sexes, no kin (ODD §5 Starting ages, Decided 2026-11-05);
    // the sexes differ only in reproduction (ODD §2 Agents, Decided 2026-11-04)
    const [a0, a1] = A.startAge;
    this.ageDays = born ? 0 : Math.floor((a0 + world.rng() * (a1 - a0)) * PARAMETERS.year.days);
    this.female = world.rng() < 0.5;
    // the life cycle (ODD §2, §7.4; life.js): a child until matureAge, with a carer who takes
    // it along (its mother, or whoever took her place) and a keeper whose ties stand for its
    // own; the charges an adult cares for; its children; a pregnancy; the children it has
    // seen grow up or die; and what it has learned a grown child is worth (as a tie weight)
    this.child = born;
    this.mother = null; this.father = null; this.carer = null; this.keeper = null;
    this.charges = []; this.kids = [];
    this.pregnant = null;
    // a starting woman first conceives after a wait, as if she had weaned a child before the
    // run began, so the first births are not one cohort (ODD §5, Decided 2026-11-07)
    this.fertileFrom = born || !this.female ? 0 : Math.floor(world.rng() * PARAMETERS.life.startWait * PARAMETERS.year.days);
    this.helped = false;
    this.childSeen = { grown: 0, died: 0, years: 0 };
    this.childL = newLearned(0);
    this.need = { food: 1, water: 1, warmth: 1, rest: 1, belonging: 1 };
    // holdings: every good at zero (water is carried in a gourd), and roots to start on
    this.hold = newHold();
    if (!born) { this.hold.roots = A.starterFood; this.hold.gourd = A.starterGourds; }   // burn-in scaffolds (ODD §5)
    // structures at home (a newborn shares its mother's, life.js)
    this.shelter = born ? null : world.dwellings ? world.newDwelling(home, id) : newShelter(home);
    // know-how (ODD §7.3): recipes and builds it can make. Starts with PARAMETERS.agents.knowhow (ODD §5);
    // grows by tinkering and by seeing others practise; kept for life, so a craft is lost
    // when everyone who knows it dies without anyone having seen them practise it
    this.knows = new Set(A.knowhow);
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
    // lives on (ODD §7.6: expected future need from seasonal norms). Each food and wood
    // gathered (wood bare-handed, so a tool's share is known from the recipe), and the net
    // gained or lost in exchange. The prior is the old assumption: a few hours of gathering at
    // the prior rates, the foraging hours split among the foods in season.
    this.flow = [0, 1, 2, 3].map((si) => {
      const ph = (si + 0.5) / 4, on = FORAGE.filter((k) => resInSeason(ACT_RES[k], ph));
      const F = {};
      for (const g of FLOW_GOODS) { F[g] = newLearned(0); F['x' + g] = newLearned(0); F['l' + g] = newLearned(0); }
      for (const k of on) F[GOOD_OF[k]] = newLearned(A.projHours.forage / on.length * A.priorPerHour[ACT_NAMES[k]]);
      F.wood = newLearned(A.projHours.wood * A.priorPerHour.wood);
      F.game = newLearned(0);   // big game's share of the meat, as if bare-handed (the spear's worth, Stage 5h)
      for (const k of GEAR_FLOWS) F[k] = newLearned(k === 'fhours' ? A.projHours.forage : 0);
      return F;
    });
    this.got = {};
    this.xnet = {};
    for (const g of FLOW_GOODS) this.got[g] = this.xnet[g] = 0;
    this.left = {};            // what its hands could not hold today, by good (learned as 'l' flows)
    for (const g of FLOW_GOODS) this.left[g] = 0;
    this.livedFood = [1, 1, 1, 1].map(newLearned);   // its usual evening food level, by season
    this.thin = [0, 0, 0, 0].map(newLearned);        // how much the land around camp thins in a week per camper, by season (ODD §5)
    this.crowd = 0;            // while a site is scored: how much its land is expected to thin (siteDay)
    this.livedLand = [0.5, 0.5, 0.5, 0.5].map(newLearned);   // how full the land around camp usually is, by season (ODD §5)
    this.landRatio = 1;        // while a site is scored: its land against the usual (siteDay)
    this.rebuild = 0;          // while a site is scored: hours to rebuild its shelter there (siteDay)
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
    for (const g of SEEN) this.seenFrac[g] = new Float32Array(n);
    // where herds usually are, by season and hex (ODD §2 Game: one more learned value, §4.4):
    // a habit from its own sightings of sign, a norm from sightings told in chat, and how far
    // each has missed its own sightings (one record for all hexes)
    this.herdH = new Uint16Array(4 * n); this.herdN = new Uint16Array(4 * n);
    this.herdMiss = { eh: -1, en: -1 };
    this.gotGame = 0;          // big game's meat today, as if bare-handed
    newInjury(this);
    this.trek = null;          // progress on a leg home when stranded: {from, to, done hours}
    this._injK = null;         // injury costs today, by where it would sleep (injuryCost)
    this.seenDay = new Int32Array(n);
    this.seenGrain = new Float32Array(n);   // ripe grain standing in fields, as last seen
    for (const h of world.grid.within(home, A.sight)) this.look(world, h);
    this.plan = [];            // today's stops [{hex, act, hours}]
    this.obs = [];             // today's observations, applied in the Learn phase
    this.busy = 0;             // hours travelled + worked today
    this.log = { forageHours: 0, forageTravel: 0 };
    this.walked = 0;           // hours walked moving camp this morning (ODD §5 Moving camp)
    this.store = null;         // out for the night: what stayed where it sleeps (ODD §2 carrying)
    this.carried = null;       // what it carried today, by weight and kind
    this.carryFood = 0;        // food burned today carrying (weight times hours walked)
    this._carryFood = 0; this._storeTonight = null;   // the planner's, for the route it scores
    this.movedKgHours = 0;     // weight carried times hours walked moving camp this morning
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
    // a morning spent moving camp is gone; care and late pregnancy take hours (life.js)
    let w = workingHours(this);
    if (this.hurt > 0) w *= PARAMETERS.injury.minorCut;   // healing (ODD §2 Game)
    return w - this.walked - careTaken(this, w - this.walked);
  }

  // ── Travel and work: walk the plan, gather, drink, build, look around ─────────────────
  act(world) {
    const A = PARAMETERS.agents, G = PARAMETERS.goods;
    const start = this.at >= 0 ? this.at : this.home;
    let at = start, hours = 0;
    this.drank = false;
    // where it was today: where it woke, the stops, and where it sleeps (camp, or out where its
    // hunt ended: ODD §5 multi-day trips)
    this.places = [start];
    this.log.forageHours = 0; this.log.forageTravel = 0;
    this.dayRet = { food: 0, hours: 0, gear: carryGear(this.hold) };   // gathering today, and with what gear
    this.practised = [];
    for (const g of FLOW_GOODS) this.got[g] = 0;
    this.si = world.seasonIndex;
    let made = 0;              // hours at home making, building or tinkering
    const ex = this.expo = { camp: 1, out: 0, hunt: 0, build: 0, herd: null };   // exposure to injury today (ODD §2 Game)
    // what it carries (ODD §2 Containers and carrying, Decided 2026-11-12): out, all it has with
    // it; from camp, its vessels' water, or for a night out planned this morning, the pack it
    // takes, the rest staying where it sleeps (`store`)
    if (start === this.home && this.plan.out && !this.store) { const [p, s] = packOut(this, this.hold); this.hold = p; this.store = s; }
    const c = this.carried = this.store ? carriedOf(this.hold) : newCarried();
    if (!this.store) carryAdd(c, 'water', Math.min(this.hold.water, vesselCap(this.hold)));
    // the weight carried times the hours walked with it (Decided: part of the day's effort)
    const kidKg = childKg(this);
    let kgHours = this.movedKgHours || 0;   // and what it carried moving camp this morning
    this.movedKgHours = 0;
    const walkLeg = (h) => { kgHours += (c.kg + kidKg) * h; };
    // take up what it gathers as far as it can carry, eat what it can of the rest there with the
    // weaned children along (ODD §7.4, Decided 2026-11-17), and leave the remainder: returns
    // [carried, eaten]
    const takeUp = (g, q) => {
      const kept = Math.min(q, carryRoom(this, this.hold, c, g));
      const eaten = eatInPlace(this, g, q - kept);
      this.hold[g] += kept; carryAdd(c, g, kept);
      return [kept, eaten];
    };
    for (const s of this.plan) {
      const leg = world.travel(at)[s.hex];
      hours += leg;
      walkLeg(leg);
      at = s.hex;
      this.places.push(s.hex);
      this.see(world, s.hex);
      if (IS_GATHER[s.act]) {
        const res = ACT_RES[s.act], cap = world.caps[res][s.hex];
        const frac = cap > 0 && world.inSeason(res) ? world.amount(res, s.hex) / cap : 0;
        // a tool for the task multiplies the yield and wears by the hour (ODD §2 Tools)
        const tool = TOOL_FOR[s.act], mult = tool && this.hold[tool] > 0 ? TOOLS[tool].mult : 1;
        const good = GOOD_OF[s.act];
        // it takes up only what it can carry or eat there; the rest stays growing
        const want = frac > 0 ? gatherRate(res) * frac * mult * s.hours * workRate(this) : 0;
        const room = carryRoom(this, this.hold, c, good) + (FOOD_SET[good] ? eatRoomAll(this, good) : 0);
        const got = want > 0 ? world.take(res, s.hex, Math.min(want, room)) : 0;
        const [kept, eaten] = takeUp(good, got);
        if (IS_FORAGE[s.act] && FOOD_SET[good]) { this.dayRet.food += (kept + eaten) * G[good].restores / mult; this.dayRet.hours += s.hours; }
        // what its hands could not hold, bare-handed (learned: the worth of a basket or a bag)
        if (this.left && this.left[good] != null && got >= Math.min(want, room) - 1e-9 && want > room) this.left[good] += (want - room) / mult;
        if (s.act === A_SMALL && got > 0) takeUp('hide', got * PARAMETERS.hunt.smallHide);   // small game's skins
        // children along who help, at a child's rate and bare-handed (ODD §2, Stage 6): their
        // haul is the carer's; it does not enter what the carer learns of its own rate
        for (const ch of this.charges) {
          const r = workRate(ch);
          if (!(r > 0) || !(frac > 0)) continue;
          const extra = world.take(res, s.hex, Math.min(gatherRate(res) * frac * s.hours * r,
            carryRoom(this, this.hold, c, good) + (FOOD_SET[good] ? eatRoomAll(this, good) : 0)));
          takeUp(good, extra);
          if (extra > 0) ch.helped = true;
        }
        if (mult > 1) this.hold[tool] = Math.max(0, this.hold[tool] - s.hours / TOOLS[tool].life);
        if (this.got[good] != null) this.got[good] += (kept + eaten) / mult;
        // what it learns is the bare-handed rate the place gave (the tool's share is known from
        // the recipe), whether or not it could carry it all
        const seen = got < Math.min(want, room) - 1e-9 ? got : want;
        if (workRate(this) === 1) this.obs.push({ act: s.act, hex: s.hex, perHour: seen / s.hours / mult, frac, season: world.seasonIndex });
        this.look(world, s.hex);   // sees what it left behind
        if (IS_FORAGE[s.act]) { this.log.forageHours += s.hours; this.log.forageTravel = Math.max(this.log.forageTravel, world.travel(this.home)[s.hex]); }
      } else if (s.act === A_SNARE) {
        // tend its snares here: take what they caught since it was last here, and set more
        // (ODD §2 Game: snares catch while the owner is elsewhere; World.snaresDay)
        const got = world.tendSnares(this, s.hex, s.hours);
        const [kept, eaten] = takeUp('meat', got);
        this.got.meat += kept + eaten;
        if (got > 0) takeUp('hide', got * PARAMETERS.hunt.smallHide);
        if (got - kept - eaten > 0) this.snaresAt.get(s.hex).caught += got - kept - eaten;   // left in the snares
        const frac = world.amount('smallgame', s.hex) / world.caps.smallgame[s.hex];
        this.obs.push({ act: A_SNARE, hex: s.hex, perHour: got / s.hours, frac, season: world.seasonIndex });
        this.look(world, s.hex);
      } else if (s.act === A_HUNT) {
        // track the herd from the stop and hunt it (ODD §2 Game); the kill is settled once
        // everyone has acted, when the party on each herd is known (World.settleHunts)
        at = this.hunt(world, s);
      } else if (s.act === A_DRINK) {
        const src = world.waterAt[s.hex];   // the hex itself, or the river or lake beside it
        if (src >= 0 && world.stock.water[src] > 0) {
          world.take('water', src, PARAMETERS.goods.drinkDraw);
          this.drank = true;
          // vessels fill wherever it drinks; the pot only at camp, where it stays
          if (s.hex === this.home && !this.store) this.hold.water = Math.max(this.hold.water, waterCarried(this.hold));
          else {
            const add = Math.max(0, Math.min(vesselCap(this.hold) - c.water / goodKg('water'), carryRoom(this, this.hold, c, 'water')));
            this.hold.water += add; carryAdd(c, 'water', add);
          }
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
      } else if (s.act === A_PROCESS) {
        // process a food at home (ODD §2 Plant kinds, Stage 5g: drying, roasting, grinding)
        if (this.knows.has(processKnow(s.process)) && processFood(this.hold, s.process, s.hours) > 0) {
          this.practised.push({ hex: s.hex, what: processKnow(s.process) });
          world.made[s.process] = (world.made[s.process] || 0) + 1;
        }
        made += s.hours;
      } else if (s.act === A_SOW) {
        // sow grain in a field (ODD §7.6 v0 food level 2); the hoe multiplies the work
        const mult = this.hold.hoe > 0 ? TOOLS.hoe.mult : 1;
        const seeds = Math.min(this.hold.grain, s.hours * G.grain.sowPerHour * mult);
        if (this.knows.has('farm') && seeds > 1e-6 && world.canSow(s.hex)) {
          this.hold.grain -= world.sow(this, s.hex, seeds);   // as many as the field has room for
          if (mult > 1) this.hold.hoe = Math.max(0, this.hold.hoe - s.hours / TOOLS.hoe.life);
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
      // goods lying here, open to anyone: it takes up what it can carry (ODD §2 carrying)
      if (s.hex !== this.home || this.store) world.pickUp(this, s.hex, false);
    }
    // stranded beyond today's hours (hurt, or worn down out): the hours its plan leaves go toward
    // the next hex on the way home, and the progress carries to the next day (ODD §2 Game,
    // Decided — Chris, 2026-11-12: walking, work and care are one budget)
    if (start !== this.home && !(world.travel(start)[this.home] <= this.capacity())) {
      let left = this.capacity() - hours;
      while (left > 1e-9 && at !== this.home) {
        const next = stepToward(world, at, this.home);
        if (next < 0) break;
        if (!this.trek || this.trek.from !== at || this.trek.to !== next) this.trek = { from: at, to: next, done: 0 };
        const need = world.travel(at)[next] - this.trek.done;
        if (left >= need) { left -= need; hours += need; walkLeg(need); at = next; this.places.push(at); this.see(world, at); this.trek = null; }
        else { this.trek.done += left; hours += left; walkLeg(left); left = 0; }
      }
    } else this.trek = null;
    // out for the night as planned, or where it is when camp is beyond today's walk
    this.out = at !== this.home && (!!this.plan.out || !(world.travel(at)[this.home] < Infinity));
    if (this.out) {
      this.at = at;
      // out without having packed (camp beyond reach): what it has stays with it, the rest at camp
      if (!this.store) { const [p, s] = packOut(this, this.hold); this.hold = p; this.store = s; }
    } else {
      if (this.plan.length || start !== this.home) { const h = world.travel(at)[this.home]; hours += h; walkLeg(h); }
      if (start !== this.home && this.places[this.places.length - 1] !== this.home) this.places.push(this.home);
      this.at = -1;
      // home: what it carried joins what stayed where it sleeps
      if (this.store) { for (const g in this.store) this.hold[g] += this.store[g]; this.store = null; }
    }
    this.busy = hours;
    this.carryFood = PARAMETERS.carry.burn * kgHours;
    // exposure (ODD §2 Game): the walking and the work away from camp are "out"; building is its
    // own; big game's hours are settled with the hunt (World.settleHunts, Agent.hunt)
    let walk = hours;
    for (const s of this.plan) {
      walk -= s.hours;
      if (s.act === A_BUILD) ex.build += s.hours;
      else if (s.act !== A_HUNT && s.hex !== this.home) ex.out += s.hours;
    }
    ex.out += Math.max(0, walk);
    // its usual working day, apart from drinking and making (learned by season, ODD §4.4)
    const routine = Math.max(0, hours - made - (this.drank ? this.drinkTrip : 0));
    const si = world.seasonIndex;
    learnOwn(this.busyHabit[si], routine, PARAMETERS.agents.flowRate);   // as the other seasonal habits
  }

  // Hunting big game from a stop (ODD §2 Game, Decided 2026-11-11): the hunter follows sign
  // from the stop hex, a step at a time within the stop's hours, to a herd seen on its hex or
  // the next, else up the herd trace; on a herd it hunts out the hours left. The attempt is
  // settled with the others on that herd (World.settleHunts). Returns where it ends up: its
  // route goes on from there (or it sleeps there, on a night out), so following a herd far
  // costs the walk back.
  hunt(world, s) {
    const H = PARAMETERS.hunt, g = world.grid, tr = world.game.trace.herd;
    let cur = s.hex, left = s.hours;
    const herdOn = (h) => world.game.herds.find((x) => x.hex === h && x.n >= 1);
    for (;;) {
      if (herdOn(cur)) break;
      let next = -1, best = tr[cur] + H.minTrace;
      for (let d = 0; d < 6; d++) {
        const m = g.nbr[cur * 6 + d];
        if (m < 0 || world.hours[m] < 0) continue;
        if (herdOn(m)) { next = m; break; }
        if (tr[m] > best) { best = tr[m]; next = m; }
      }
      if (next < 0) break;
      const step = 0.5 * (world.hours[cur] + world.hours[next]);
      if (step >= left) break;
      left -= step; cur = next;
      this.places.push(cur);
      this.see(world, cur);
    }
    const herd = herdOn(cur);
    if (herd && left > 0) world.huntsToday.push({ agent: this, herd, hours: left, hex: cur, sign: s.sign || 0, stop: s.hours });
    else {
      this.obs.push({ act: A_HUNT, hex: s.hex, perHour: 0, frac: s.sign || 0, season: world.seasonIndex });
      if (this.expo) this.expo.out += s.hours;   // tracking without finding a herd (injury exposure)
    }
    return cur;
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
    const sign = herdSign(world, h);
    this.seenFrac[A_HUNT][h] = sign;
    learnHerd(this, world, h, sign, true);
    for (const k of GATHER) {
      const res = ACT_RES[k], cap = world.caps[res][h], R = PARAMETERS.resources[res];
      // out of its season a crop is seen in its plants: the crop they will bear (Stage 5g)
      this.seenFrac[k][h] = !(cap > 0) ? 0 : R.kind === 'crop' && !world.inSeason(res) ? world.cover[R.cover][h] : world.amount(res, h) / cap;
    }
    this.seenGrain[h] = world.grainHex[h];
  }

  // ── Consume: the evening at home ─────────────────────────────────────────────────────
  consume(world) {
    const out = Agent.evening(this.need, this.hold, this.out ? 0 : shelterIns(this.shelter), this.busy, this.drank,
      world.season().cold, this.capacity(), 1, foodScale(this), this.carryFood);
    if (this.out) world.nightsOut = (world.nightsOut || 0) + 1;
    this.need.food = Math.max(-needReserve('food'), out.food);
    this.need.water = Math.max(-needReserve('water'), out.water);
    this.need.warmth = out.warmth; this.need.rest = out.rest;
    for (const k of FOODS) this.hold[k] = out.hold[k] * (1 - PARAMETERS.goods[k].rot);   // each food rots at its own rate
    this.hold.wood = out.hold.wood;
    this.hold.water = out.hold.water;
    if (this.hold.pot > 0) this.hold.pot = Math.max(0, this.hold.pot - PARAMETERS.goods.pot.wear);   // pots break
    // gear wears, each piece at its rate; gourd fruit dries where it is kept (ODD §2 carrying)
    for (const g of GEAR) if (this.hold[g] > 0) this.hold[g] = Math.max(0, this.hold[g] - PARAMETERS.goods[g].wear * Math.ceil(this.hold[g] - 1e-9));
    const kept = this.store || this.hold;
    if (kept.gourdFruit > 0) { const d = kept.gourdFruit / PARAMETERS.goods.gourd.dryDays; kept.gourdFruit -= d; kept.driedGourd += d; }
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
    // out for the night: belonging only from ties sleeping out at the same hex (ODD §5 trips)
    this.need.belonging = this.out ? this.belongingWith(world.agents.filter((b) => b.out && b.at === this.at), world.day) : this.belonging(world.day);
    this.walked = 0;
  }

  // ── ties (ODD §2 Ties, Owing) ─────────────────────────────────────────────────────────
  // The record for another agent, faded to today: tallies fade with time, more slowly the
  // more dealings the tie holds (familiarity, ODD §2 Levels of trust, Stage 6); the owing
  // balance shrinks at the agent's own forgetting rate (the expected value of its daily chance).
  tie(id, day) {
    let t = this.ties.get(id);
    if (!t) { t = { kind: 0, given: 0, owed: 0, n: 0, ratio: 0, food: 0, last: day }; this.ties.set(id, t); }
    const dt = day - t.last;
    if (dt > 0) {
      const E = PARAMETERS.exchange;
      const f = Math.exp(-dt / (E.tallyMemory * (1 + t.n / E.familiarity)));
      t.kind *= f; t.given *= f; t.food *= f;
      t.owed *= Math.pow(1 - this.forget, dt);
      t.last = day;
    }
    return t;
  }
  trust(id, day) { return this.ties.has(id) ? this.tie(id, day).kind : 0; }
  owedBy(id, day) { return this.ties.has(id) ? this.tie(id, day).owed : 0; }
  // A grudge: the unreturned gifts it carries before it stops giving to (and trading with)
  // the other rise smoothly with the kindness it has received from it (ODD §2 Levels of
  // trust, Stage 6): about `owedLimit` for a new tie, out of reach for a deep one.
  grudge(id, day) {
    if (!this.ties.has(id)) return false;
    const E = PARAMETERS.exchange, t = this.tie(id, day);
    return t.owed >= E.owedLimit * (1 + t.kind / E.tolerance);
  }
  // Its weight on another's need (ODD §2, Decided 2026-11-05): the share of its belonging
  // that tie supplies, over the larger of its total and what meets the need; at most 1.
  // (The total is taken once a day, at its first use, so the day's own gifts do not move it.)
  tieWeight(id, day) {
    if (!this.ties.has(id)) return 0;
    if (this._bondDay !== day) {
      let s = 0;
      for (const [k] of this.ties) { const t = this.tie(k, day); s += Math.min(t.kind, t.given); }
      this._bondSum = s; this._bondDay = day;
    }
    const t = this.tie(id, day);
    return Math.min(t.kind, t.given) / Math.max(this._bondSum, PARAMETERS.exchange.belongingSet);
  }

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
  // eats (cooked food restores more, ODD §4.5; the fastest-rotting food first, Stage 5g) and
  // warms itself (shelter base + fire, ODD §2 Warmth; `ins` is the shelter's insulation).
  // Returns the new levels and what is left. Food and water are NOT floored here; consume()
  // floors the stored levels at the reserve (death).
  // `days` > 1 lumps several days into one step (the planner's long Keep projection): the
  // needs run down and the fire burns for that many days, and eating can make it all up.
  // `fs` scales the daily food need (a child's, a nursing or pregnant mother's; life.js).
  // `carried` is the food burned today carrying (ODD §2 Containers and carrying).
  static evening(need, hold, ins, busy, drank, cold, capacity, days, fs, carried) {
    const N = PARAMETERS.needs, G = PARAMETERS.goods;
    days = days || 1;
    let food = need.food - days * (N.foodDecay * (fs || 1) + N.workBurn * busy) - (carried || 0);
    let water = drank ? 1 : need.water - days * N.waterDecay;
    const h = { ...hold };
    // drink from the gourd
    if (water < 1 && h.water > 0) { const d = Math.min(h.water, 1 - water); water += d; h.water -= d; }
    // fire: lit whenever there is the wood (cooking and warmth); over several days, on as many
    // of them as the wood allows (a share, so the projection has no all-or-nothing week)
    const fire = days > 1 ? Math.min(1, h.wood / (G.fireWood * days)) : (h.wood >= G.fireWood ? 1 : 0);
    h.wood -= fire * G.fireWood * days;
    const pot = h.pot > 0;
    for (const k of FOODS) {
      if (!(food < 1)) break;
      const q = h[k];
      if (!(q > 0)) continue;
      const per = foodPer(k, fire, pot), eat = Math.min(q, (1 - food) / per);
      food += eat * per; h[k] = q - eat;
    }
    let warmth = 1 - cold * (1 - ins) + fire * G.fireHeat;
    const free = capacity - busy;
    const rest = clamp(free / N.restSet, 0, 1);
    return { food: Math.min(food, 1), water: Math.min(water, 1), warmth: clamp(warmth, 0, 1), rest, hold: h };
  }

  // ── Learn: habits from its own day (ODD §4.4, one error-driven update) ─────────────────
  // one error-driven update of the yield per hour from a full hex, from what it got and how
  // full the hex was (a nearly bare hex says little about the rate, so it is skipped); and a
  // slower one of what the day brought in, for the season
  learn() {
    const A = PARAMETERS.agents, F = this.flow[this.si], r = A.flowRate;
    this._inflow = null;
    for (const g of FLOW_GOODS) { learnOwn(F[g], this.got[g], r); learnOwn(F['x' + g], this.xnet[g] || 0, r); }
    learnOwn(F.game, this.gotGame, r);
    this.gotGame = 0;
    if (this.left) for (const g of FLOW_GOODS) { if (F['l' + g]) learnOwn(F['l' + g], this.left[g] || 0, r); this.left[g] = 0; }
    learnOwn(this.livedFood[this.si], this.need.food, r);
    // gathering with a basket, a bag or bare-handed: its return an hour (ODD §2 Gear is a strategy
    // whose efficiency is learned, Decided — Chris, 2026-11-13)
    const D = this.dayRet;
    if (D) {
      for (const k of GEAR_FLOWS) if (!F[k]) F[k] = newLearned(k === 'fhours' ? A.projHours.forage : 0);   // a colony saved before
      learnOwn(F.fhours, D.hours, r);
      if (D.hours > 0) learnOwn(F['r' + D.gear], D.food / D.hours, r);
      this.dayRet = null;
    }
    for (const o of this.obs) if (o.frac > 0.05) learnOwn(this.yld[o.act], o.perHour / o.frac, o.act === A_HUNT ? PARAMETERS.hunt.learnRate : o.act === A_SNARE ? PARAMETERS.snare.learnRate : A.learnRate);
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
    this._inflow = null;   // the projection's cached inflows (planner.js foodInflows)
    for (let si = 0; si < 4; si++) {
      const F = this.flow[si], G = b.flow[si];
      for (const k of FLOW_KEYS) if (G[k] && F[k] && G[k].nh > 0) learnNorm(F[k], G[k].h, r);
      if (b.livedFood[si].nh > 0) learnNorm(this.livedFood[si], b.livedFood[si].h, r);
      if (b.busyHabit[si].nh > 0) learnNorm(this.busyHabit[si], b.busyHabit[si].h, r);
      if (b.thin && this.thin && b.thin[si].nh > 0) learnNorm(this.thin[si], b.thin[si].h, r);
      if (b.livedLand && this.livedLand && b.livedLand[si].nh > 0) learnNorm(this.livedLand[si], b.livedLand[si].h, r);
    }
    if (b.farmL.nh > 0) learnNorm(this.farmL, b.farmL.h, r);
    if (b.injL && this.injL) for (const k in this.injL) if (b.injL[k].nh > 0) learnNorm(this.injL[k], b.injL[k].h, r);
  }

  // the yield it plans with: habit and norm blended by which has paid off (ODD §4.4)
  rate(act) { return this.yld[act].v; }

  // Chat with up to k of the people met today, ties first, the rest at random (ODD §4.6). Each tells where it went and what it got: the listener updates its norms and
  // takes any newer sighting of those hexes (ODD §4.6).
  chat(world) {
    const k = PARAMETERS.agents.chatK;
    // ties first (strongest trust first), then the rest in random order
    // (a child with a carer has lived nothing of its own to tell, Stage 6)
    const pool = shuffleInPlace(this.met.filter((b) => !b.carer), world.rng);
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
          for (const g of SEEN) this.seenFrac[g][h] = b.seenFrac[g][h];
          this.seenGrain[h] = b.seenGrain[h];   // ripe grain standing there, as told
          if (b.seenDay[h] === world.day) learnHerd(this, world, h, b.seenFrac[A_HUNT][h], false);
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
    if (this.killedBy) cause = this.killedBy;
    else if (this.need.water <= 1e-9 - needReserve('water')) cause = 'thirst';
    else if (this.need.food <= 1e-9 - needReserve('food')) cause = 'hunger';
    else if (this.coldDays > D.warmth) cause = 'cold';
    else if (world.rng() < hazard) cause = 'old age';
    if (cause) { this.alive = false; this.cause = cause; }
  }
};

// Process food in `hold` for `hours` (ODD §2 Plant kinds, Stage 5g): as much of the input as
// the hours, the wood for the fire and the tool allow. Returns the units of input processed.
function processFood(hold, name, hours) {
  const P = PROCESSES[name];
  if (P.tool && !(hold[P.tool] > 0)) return 0;
  let q = Math.min(hold[P.from], P.perHour * hours);
  if (P.wood) q = Math.min(q, hold.wood / P.wood);
  if (!(q > 1e-6)) return 0;
  hold[P.from] -= q;
  if (P.wood) hold.wood -= q * P.wood;
  hold[P.to] = (hold[P.to] || 0) + q * P.ratio;
  return q;
}

// Water it can carry home and store (ODD §2 v0 water ladder): a gourd, and a pot if it has one.
function waterCarried(hold) {
  const G = PARAMETERS.goods;
  return vesselCap(hold) + (hold.pot > 0 ? G.pot.cap : 0);
}

// The materials at hand at a hex (ODD §7.3): goods held, and the resources there, as the agent
// last saw them (`real` false: the planner's view) or as they are (`real` true).
var RES_GOOD = { greens: 'greens', seeds: 'grain', roots: 'roots', nuts: 'nuts', wood: 'wood', clay: 'clay', flint: 'flint', smallgame: 'game' };
function materialsAt(agent, world, hex, hold, real) {
  const at = new Set();
  for (const g of GOODS) if (hold[g] > 0) at.add(g);
  if (world.canFarm(hex)) at.add('soil');   // fertile land (Stage 5d)
  for (const act of GATHER) {
    const res = ACT_RES[act];
    const there = real ? world.amount(res, hex) > 0 : agent.seenFrac[act][hex] > 0.02;
    if (there && RES_GOOD[res]) at.add(RES_GOOD[res]);
  }
  return at;
}

// ── big game's sign (ODD §2 Game, Stage 5h) ─────────────────────────────────────────────────
// How surely a hex reads as a herd: 1 with a herd on it, else its herd trace against `signFull`.
// the neighbouring hex one step nearer `to` from `at` (by the walk from `to`); -1 if none is
function stepToward(world, at, to) {
  const tr = world.travel(to), g = world.grid;
  let best = -1, bt = tr[at];
  for (let d = 0; d < 6; d++) {
    const m = g.nbr[at * 6 + d];
    if (m >= 0 && tr[m] < bt) { bt = tr[m]; best = m; }
  }
  return best;
}
function herdSign(world, h) {
  if (!world.game) return 0;
  for (const x of world.game.herds) if (x.hex === h && x.n >= 1) return 1;
  return Math.min(1, world.game.trace.herd[h] / PARAMETERS.hunt.signFull);
}
// One sighting of sign at hex `h` this season: its own (`own`, the habit) or told (the norm),
// by one error-driven update of where herds usually are (ODD §4.4). Own sightings also score
// how far habit and norm each missed, one record for all hexes.
function learnHerd(agent, world, h, sign, own) {
  if (!agent.herdH) return;
  const k = world.seasonIndex * world.grid.n + h, r = PARAMETERS.hunt.seasonRate, U = 65535;
  if (own) {
    const hab = agent.herdH[k] / U, nor = agent.herdN[k] / U, q = PARAMETERS.agents.arbRate, M = agent.herdMiss;
    const mh = (sign - hab) * (sign - hab), mn = (sign - nor) * (sign - nor);
    M.eh = M.eh < 0 ? mh : M.eh + q * (mh - M.eh);
    if (nor > 0) M.en = M.en < 0 ? mn : M.en + q * (mn - M.en);
    agent.herdH[k] = Math.round(U * clamp(hab + r * (sign - hab), 0, 1));
  } else {
    const nor = agent.herdN[k] / U;
    agent.herdN[k] = Math.round(U * clamp(nor + r * (sign - nor), 0, 1));
  }
}
// Where herds usually are this season at hex `h`: habit and norm, blended by how far each has
// missed (beyond `arbExtreme`, one alone)
function herdUsual(agent, world, h) {
  if (!agent.herdH) return 0;
  const k = world.seasonIndex * world.grid.n + h, hab = agent.herdH[k] / 65535, nor = agent.herdN[k] / 65535, M = agent.herdMiss;
  if (M.en < 0) return Math.max(hab, nor);
  let w = 0.5;
  if (M.eh >= 0) { const ph = 1 / (M.eh + 1e-12), pn = 1 / (M.en + 1e-12); w = ph / (ph + pn); }
  const X = PARAMETERS.agents.arbExtreme;
  if (w > X) w = 1; else if (w < 1 - X) w = 0;
  return w * hab + (1 - w) * nor;
}
// The sign it expects at hex `h` today: its last sighting, giving way over `memory` days to
// where herds usually are (what is true recently counts more than last season; Chris)
function herdExpect(agent, world, h) {
  const age = world.day - agent.seenDay[h], w = Math.exp(-age / PARAMETERS.hunt.memory);
  return w * agent.seenFrac[A_HUNT][h] + (1 - w) * herdUsual(agent, world, h);
}
// A hunter's chance on a herd rises with the others hunting it that day, toward 1 + `party`
// (ODD §2 Game: emergent parties, Decided 2026-11-11)
function partyFactor(k) {
  const H = PARAMETERS.hunt;
  return 1 + H.party * (1 - Math.exp(-Math.max(0, k - 1) / H.partyScale));
}

// ── injury (ODD §2 Game, Decided — Chris, 2026-11-11: minor injuries that heal, major ones that
// leave a disability, and death, as risks all people face; lowest in camp, higher out of camp,
// highest hunting big game, some in building) ────────────────────────────────────────────────
// Each agent learns the rate in each setting (§4.4: a habit from its own injuries, a norm from
// rates told in chat), starting from the true rates.
function newInjury(a) {
  const I = PARAMETERS.injury;
  a.injL = { camp: newLearned(I.camp), out: newLearned(I.out), hunt: newLearned(I.hunt), build: newLearned(I.build) };
  a.disabled = 1; a.hurt = 0;   // working hours kept for life; days left to heal
}
// waking hours as age and any disability leave them, before care and injury
function workingHours(a) {
  const A = PARAMETERS.agents, years = a.ageDays / PARAMETERS.year.days;
  const f = clamp(1 - (years - A.oldAge.declineStart) / A.oldAge.declineSpan, A.oldAge.floor, 1);
  return A.wakingHours * f * (a.disabled || 1);
}
// The expected cost of one injury to this agent if it comes where it sleeps tonight (`hex`), in
// the forecast's units: the days a minor one takes, the share of working life a major one
// takes, and death as the life ahead (the discounted days of the projection at the worst need
// cost; ODD §2 Game: risk is learned and priced). Who and where (Decided — Chris, 2026-11-12):
// a death costs its life and each dependent's at its weight on that child (§7.4), since a
// dependent shares its carer's water and goes where it goes; a minor injury costs as death
// where the hours it leaves (less care) cannot reach water it knows before its water runs out.
function injuryCost(agent, world, hex) {
  const I = PARAMETERS.injury, S = I.shares;
  if (world._injDay !== world.day) {
    let life = 0;
    for (const T of projectionTable(world)) life += T.beta * T.len;
    world._injDay = world.day; world._injLife = life;
  }
  // the same all day for one agent and one hex (the planner asks many times)
  let K = agent._injK;
  if (!K || K.day !== world.day) {
    let deps = 0;
    for (const c of agent.charges) deps += weightOn(agent, c, world.day);
    K = agent._injK = { day: world.day, death: world._injLife * WORST_NEED_COST * (1 + deps),
      hurt: workingHours(agent) * I.minorCut - careTaken(agent, workingHours(agent) * I.minorCut),
      days: (agent.need.water + needReserve('water')) / PARAMETERS.needs.waterDecay, at: new Map() };
  }
  let c = K.at.get(hex);
  if (c === undefined) {
    const reach = K.hurt > 0 ? knownWaterFrom(agent, world, hex) + PARAMETERS.agents.drinkHours : Infinity;
    const minor = reach <= K.hurt * K.days ? I.minorDays * I.dayCost : K.death;
    c = S.minor * minor + S.major * I.majorCut * world._injLife * I.dayCost + S.death * K.death;
    K.at.set(hex, c);
  }
  return c;
}

// The best hunting weapon it holds for big game: the bow, else the spear (the hunting ladder,
// ODD §2 Game, Decided 2026-11-11); null if neither
function huntTool(hold) { return hold.bow > 0 ? 'bow' : hold.spear > 0 ? 'spear' : null; }
