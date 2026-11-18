'use strict';
// The recipe tree as data (ODD §2 First tree v0). Stage 5a: the stone tools. Stage 5b: clay,
// pots and the hut. Farming and metals join later.
//
// A tool is a multiplier on production for its task (ODD §2 Tools). It is held as remaining
// life: a new tool is 1, and each hour of use takes 1/life off it. Starting know-how (ODD §5,
// Decided) is a setting, PARAMETERS.agents.knowhow: by default the stone tools only (fire needs
// no know-how), and every level on a ladder must be discovered by tinkering (ODD §7.3).
// Stage 5g adds the processing of foods.

// tasks a tool can speed, by activity
var TOOLS = {
  axe:  { act: A_WOOD,   mult: 2, life: 80 },   // cutting wood
  pick: { act: A_QUARRY, mult: 2, life: 80 },   // quarrying flint (and later ore, wells)
  hoe:    { act: A_SOW,  mult: 2, life: 80 },   // sowing (Stage 5d)
  sickle: { act: A_REAP, mult: 2, life: 80 },   // reaping
  spear:  { act: A_HUNT, mult: 2, life: 80 },    // big game (ODD §2 Game, Stage 5h: in the starting kit)
  bow:    { act: A_HUNT, mult: 3, life: 160 },   // big game at a distance: the hunting ladder's second rung
};
// the tool that speeds each activity, if any (big game's best weapon held: huntTool)
var TOOL_FOR = [];
for (const t in TOOLS) if (TOOL_FOR[TOOLS[t].act] == null) TOOL_FOR[TOOLS[t].act] = t;

// recipes for goods made at home: inputs consumed, hours of work, level on its ladder.
// `keep`: the Keep projection assumes it is made when the inputs are in hand (ODD §7.6), for
// goods whose use the projection models (the axe cuts projected wood; the pot saves projected
// trips to water).
var RECIPES = {
  axe:  { inputs: { flint: 2, wood: 1 }, hours: 3, level: 0, keep: true },
  pick: { inputs: { flint: 2, wood: 1 }, hours: 3, level: 0 },
  hoe:    { inputs: { flint: 2, wood: 1 }, hours: 3, level: 0 },
  sickle: { inputs: { flint: 2, wood: 1 }, hours: 3, level: 0 },
  spear:  { inputs: { flint: 1, wood: 1 }, hours: 2, level: 0, keep: true },   // a stone point on a shaft
  bow:    { inputs: { wood: 2, flint: 1 }, hours: 6, level: 2, keep: true },   // and arrows: the hunting ladder (Stage 5h)
  // water level 2: a clay pot, fired in an open fire (ODD §2 v0: carried and stored in a pot)
  pot:  { inputs: { clay: 2, wood: 3 }, hours: 3, level: 2, keep: true },
  // the first material tree (ODD §2 Containers and carrying, Decided 2026-11-12): a dried gourd
  // cleaned out and stoppered; leather sewn into a water skin or a carrying bag; fibre plaited
  // into a basket
  gourd:     { inputs: { driedGourd: 1 }, hours: 1, level: 1, keep: true },
  waterskin: { inputs: { leather: 1 }, hours: 3, level: 2, keep: true },
  bag:       { inputs: { leather: 1 }, hours: 3, level: 2, keep: true },
  basket:    { inputs: { fibre: 4 }, hours: 4, level: 1, keep: true },
};
// gear that wears by the day (PARAMETERS.goods[g].wear) and carries: vessels and containers
var GEAR = ['gourd', 'waterskin', 'bag', 'basket'];

// structures built at home over one or more days (ODD §7.6 partial projects). Inputs are
// used in proportion to the work done; `hours` is the work by hand, and `tool`, if held,
// multiplies the work (ODD §2 Tools) and wears by the hour. A lean-to's warmth grows with the
// work; a hut gives warmth only once finished.
var BUILDS = {
  leanTo: { inputs: { wood: 10 }, hours: 4, level: 1 },
  // shelter level 2: poles (cut faster with an axe), clay daub, a hearth (ODD §2 v0)
  hut:    { inputs: { wood: 20, clay: 6 }, hours: 40, level: 2, tool: 'axe' },
};

// processing (ODD §2 Plant kinds, Stage 5g): work at home that turns a food into another with
// other properties (tree's GOODS entries in params.js). Per hour, `perHour` units of `from`
// become `ratio` units each of `to`; `wood` is burned per unit taken (a fire), and `tool`, a
// good held, is needed but not used up (a grinding stone)
var PROCESSES = {
  drying:   { from: 'greens', to: 'driedGreens', ratio: 1 / 3, perHour: 12 },      // keeps
  roasting: { from: 'nuts', to: 'roastedNuts', ratio: 1, perHour: 10, wood: 0.1 },  // keeps, a little more food
  grinding: { from: 'grain', to: 'meal', ratio: 1, perHour: 4, tool: 'flint' },     // more food, no pot to cook it
  // meat dried in strips (ODD §2 Game, Default 2026-11-11): known with drying
  dryingMeat: { from: 'meat', to: 'driedMeat', ratio: 1 / 2, perHour: 12, know: 'drying' },
  // a hide scraped, soaked and worked soft (ODD §2 Containers and carrying, Decided 2026-11-12)
  tanning: { from: 'hide', to: 'leather', ratio: 1, perHour: 0.25 },
};
// the know-how a process needs (its own name unless it says)
function processKnow(p) { return PROCESSES[p].know || p; }

// what tinkering can find, and what each needs at hand: goods held or resources in the hex,
// plus the tool (ODD §7.3: the chance of finding a level depends on holding its inputs)
var DISCOVERABLE = {
  // shelter level 1 (ODD §5: no tech level known by default)
  leanTo: { needs: ['wood'] },
  drying: { needs: ['greens'] },
  roasting: { needs: ['nuts', 'wood'] },
  grinding: { needs: ['grain', 'flint'] },
  pot: { needs: ['clay', 'wood'] },
  hut: { needs: ['clay', 'wood'], tool: 'axe' },
  // food level 2: sowing grain (Stage 5d); 'soil' is fertile land in the hex
  farm: { needs: ['grain', 'soil'] },
  // the hunting ladder (ODD §2 Game, Decided 2026-11-11): snares where small game runs ('game');
  // then the bow, worked out by a hunter with a spear in hand
  snare: { needs: ['wood', 'game'] },
  bow: { needs: ['wood', 'flint'], tool: 'spear' },
  // the first material tree (Decided 2026-11-12; found by tinkering, Default)
  tanning: { needs: ['hide'] },
  waterskin: { needs: ['leather'] },
  bag: { needs: ['leather'] },
  basket: { needs: ['fibre'] },
};

// the foods (ODD §2 Plant kinds, Stage 5g), in the order they are eaten: fastest-rotting first
var FOODS = ['greens', 'grain', 'roots', 'nuts', 'driedGreens', 'roastedNuts', 'meal', 'meat', 'driedMeat']
  .sort((a, b) => PARAMETERS.goods[b].rot - PARAMETERS.goods[a].rot);
// goods that change hands (water stays in the gourd or pot); the index orders each pair for
// prices, so every food comes before wood
var GOODS = FOODS.concat(['wood', 'flint', 'axe', 'pick', 'clay', 'pot', 'hoe', 'sickle', 'spear', 'bow', 'water',
  'gourdFruit', 'driedGourd', 'hide', 'leather', 'fibre', 'gourd', 'waterskin', 'bag', 'basket']);
// a holding of every good at zero, built as one literal: V8 keeps an object built a key at a
// time fast only up to 19 keys, and a slow holding made the planner 3-5x slower (Stage 5h)
var newHold = new Function('return {' + GOODS.map((g) => g + ': 0').join(', ') + '};');
// goods traded whole, one at a time
var WHOLE = { axe: true, pick: true, pot: true, hoe: true, sickle: true, spear: true, bow: true,
  gourd: true, waterskin: true, bag: true, basket: true };

// ── carrying (ODD §2 Containers and carrying, Decided — Chris, 2026-11-12) ──────────────────
// Each carried good is of a kind: loose (a couple of handfuls in bare hands), bulky (an armful)
// or water (none without a vessel). Goods of no kind (tools and gear) go in hand; the pot is
// storage and stays where its owner sleeps.
var CARRY_KIND = { greens: 'loose', grain: 'loose', nuts: 'loose', driedGreens: 'loose', roastedNuts: 'loose', meal: 'loose',
  roots: 'bulky', meat: 'bulky', driedMeat: 'bulky', wood: 'bulky', flint: 'bulky', clay: 'bulky', water: 'water',
  gourdFruit: 'bulky', driedGourd: 'bulky', hide: 'bulky', leather: 'bulky', fibre: 'bulky' };
var STAYS = { pot: true };
var FOOD_SET = {};
for (const f of FOODS) FOOD_SET[f] = true;
// for each food in FOODS order, whether it is loose (a basket takes it) or bulky (a bag)
var FOOD_LOOSE = FOODS.map((f) => CARRY_KIND[f] === 'loose');
function goodKg(g) { return PARAMETERS.carry.weight[g] || 0; }
// carried children take part of the load (Decided): an infant, a child under helpAge, older
function childKg(a) {
  const C = PARAMETERS.carry, L = PARAMETERS.life;
  let kg = 0;
  for (const c of a.charges) { const y = ageYears(c); kg += C.child[y < L.nurseAge ? 0 : y < L.helpAge ? 1 : 2]; }
  return kg;
}
// what it can carry, by weight: an adult's load, a working child's by its work rate, less the
// children it carries
function carryLoad(a) { return Math.max(0, PARAMETERS.carry.load * (a.child ? workRate(a) : 1) - childKg(a)); }
// water its vessels hold (need units): each gourd and water skin it has, worn or not
function vesselCap(hold) {
  const G = PARAMETERS.goods, n = (g) => (hold[g] > 0 ? Math.ceil(hold[g] - 1e-9) : 0);
  return G.gourd.cap * n('gourd') + G.waterskin.cap * n('waterskin');
}
// the most of a kind it can carry, by weight, with what it holds: a basket or a bag takes loose
// food up to the whole load, a bag bulky goods (gear raises its kind's cap, Decided)
function kindCap(hold, kind) {
  if (kind === 'water') return vesselCap(hold) * goodKg('water');
  if (kind === 'loose' && (hold.basket > 0 || hold.bag > 0)) return Infinity;
  if (kind === 'bulky' && hold.bag > 0) return Infinity;
  return PARAMETERS.carry.bare[kind];
}
// the carrying gear it goes out with: a bag (loose and bulky), else a basket (loose), else none
function carryGear(hold) { return hold.bag > 0 ? 'bag' : hold.basket > 0 ? 'basket' : 'bare'; }
function newCarried() { return { kg: 0, loose: 0, bulky: 0, water: 0 }; }
function carryAdd(c, g, q) {
  const kind = CARRY_KIND[g];
  if (!kind || !(q > 0)) return;
  const kg = q * goodKg(g);
  c.kg += kg; c[kind] += kg;
}
// how much more of good `g` it can take up, carrying `c`
function carryRoom(a, hold, c, g) {
  const kind = CARRY_KIND[g], w = goodKg(g);
  if (!kind || !(w > 0)) return Infinity;
  return Math.max(0, Math.min(carryLoad(a) - c.kg, kindCap(hold, kind) - c[kind])) / w;
}
// what a holding weighs carried, by kind (everything in it but what stays)
function carriedOf(hold) {
  const c = newCarried();
  for (const g in CARRY_KIND) carryAdd(c, g, hold[g]);
  return c;
}
// Going out for the night from camp: what it takes (gear in hand, its vessels' water, and food
// for the night, best food per kg first, as far as it can carry) and what stays where it
// sleeps. Returns [pack, store], each a whole holding.
function packOut(a, hold) {
  const pack = newHold(), store = { ...hold };
  for (const g in hold) if (!CARRY_KIND[g] && !STAYS[g]) { pack[g] = hold[g]; store[g] = 0; }
  const c = newCarried();
  const w = Math.min(hold.water, vesselCap(hold), carryRoom(a, pack, c, 'water'));
  if (w > 0) { pack.water = w; store.water -= w; carryAdd(c, 'water', w); }
  let want = PARAMETERS.needs.foodDecay * foodScale(a);
  const foods = FOODS.slice().sort((x, y) => PARAMETERS.goods[y].restores / goodKg(y) - PARAMETERS.goods[x].restores / goodKg(x));
  for (const g of foods) {
    if (!(want > 0)) break;
    const per = PARAMETERS.goods[g].restores, q = Math.min(store[g], want / per, carryRoom(a, pack, c, g));
    if (!(q > 0)) continue;
    pack[g] += q; store[g] -= q; carryAdd(c, g, q); want -= q * per;
  }
  return [pack, store];
}
// Moving camp: what it carries to the new one (tools in hand; then the pot, then food, best per
// kg first, then flint, wood and clay, as far as it can carry) and what stays at the old camp,
// open to anyone (Decided — Chris, 2026-11-12). Water is left; it drinks at the new site.
// Returns [carried, left], each a whole holding.
function movingLoad(a, hold) {
  const carried = newHold(), left = { ...hold };
  for (const g in hold) if (!CARRY_KIND[g] && !STAYS[g]) { carried[g] = hold[g]; left[g] = 0; }
  const c = newCarried(), load = carryLoad(a);
  for (const g of carryOrder()) {
    const kind = CARRY_KIND[g] || 'bulky', w = goodKg(g);
    const q = Math.min(left[g], w > 0 ? Math.max(0, Math.min(load - c.kg, kindCap(carried, kind) - c[kind])) / w : left[g]);
    if (!(q > 0)) continue;
    carried[g] += q; left[g] -= q; c.kg += q * w; c[kind] += q * w;
  }
  return [carried, left];
}
// The order goods are taken up when there is more than can be carried: the pot, then food, best
// per kg first, then the material tree's goods, then flint, wood and clay (Default; water is
// drunk where it lies).
var _carryOrder = null;
function carryOrder() {
  if (_carryOrder) return _carryOrder;
  const foods = FOODS.slice().sort((x, y) => PARAMETERS.goods[y].restores / goodKg(y) - PARAMETERS.goods[x].restores / goodKg(x));
  return (_carryOrder = ['pot'].concat(foods, ['leather', 'driedGourd', 'gourdFruit', 'hide', 'fibre', 'flint', 'wood', 'clay']));
}
// Goods lying `L` where it stops: it takes up what it can carry, in the carrying order, and tools
// in hand; `L` is changed in place (World.pickUp, and the planner's forecast of it)
function takeLying(a, hold, c, L) {
  for (const g of carryOrder()) {
    if (!(L[g] > 0)) continue;
    const w = goodKg(g), kind = CARRY_KIND[g] || 'bulky';
    const q = Math.min(L[g], Math.max(0, Math.min(carryLoad(a) - c.kg, kindCap(hold, kind) - c[kind])) / w);
    if (!(q > 0)) continue;
    hold[g] += q; L[g] -= q; c.kg += q * w; c[kind] += q * w;
  }
  for (const g in L) if (!CARRY_KIND[g] && !STAYS[g] && L[g] > 0) { hold[g] += L[g]; L[g] = 0; }
}
// One trip back for goods lying somewhere (ODD §2 Fetching is moving camp in more than one
// trip): what it takes up of `lying`, carrying gear `gear` and nothing else. Returns [taken,
// rest], `taken` holding only the goods taken up.
function fetchLoad(a, lying, gear) {
  const L = { ...lying, water: 0 };
  for (const g in gear) if (!CARRY_KIND[g] && !STAYS[g] && gear[g] > 0) L[g] = gear[g];
  const [carried, rest] = movingLoad(a, L);
  const taken = newHold();
  for (const g of carryOrder()) { taken[g] = carried[g]; }
  for (const g in rest) if (!CARRY_KIND[g] && !STAYS[g]) rest[g] = 0;
  return [taken, rest];
}
// what it can eat where it gathers, of food `g` (Decided: food and water can be eaten in place):
// up to a day's food need, raw
function eatRoom(a, g) {
  const N = PARAMETERS.needs, per = foodPer(g, 0, false);
  return per > 0 ? Math.max(0, 1 + N.foodDecay * foodScale(a) - a.need.food) / per : 0;
}
// who eats where `a` gathers: it and the weaned children with it (ODD §7.4 Children eat in
// place with their mother, Decided 2026-11-17)
function eatersAt(a) {
  const e = [a];
  for (const c of a.charges || []) if (c.alive && c.child && !isInfant(c)) e.push(c);
  return e;
}
function eatRoomAll(a, g) { return eatersAt(a).reduce((s, x) => s + eatRoom(x, g), 0); }
// eat up to `q` of food `g` there, shared in proportion to each one's room (Default); returns
// the units eaten
function eatInPlace(a, g, q) {
  if (!FOOD_SET[g] || !(q > 0)) return 0;
  const E = eatersAt(a), rooms = E.map((x) => eatRoom(x, g)), tot = rooms.reduce((s, r) => s + r, 0);
  if (!(tot > 0)) return 0;
  const eaten = Math.min(q, tot), per = foodPer(g, 0, false);
  E.forEach((x, i) => { if (rooms[i] > 0) x.need.food += eaten * rooms[i] / tot * per; });
  return eaten;
}
