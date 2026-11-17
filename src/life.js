'use strict';
// The life cycle (ODD §2 Agents life cycle, §7.4 Births; Stage 6): pregnancy, birth, nursing,
// childhood with a carer, care as hours drawn from the carer's rest, a parent's weight on its
// child's needs, conception weighed each month by both parents, and a child passed on when its
// carer dies. Children are agents. A child with a carer does not plan: it goes with its carer,
// eats what it is given, and from `helpAge` works at the carer's task at a child's rate
// (ODD §2, Decided 2026-11-04). Numbers are PARAMETERS.life.

function ageYears(a) { return a.ageDays / PARAMETERS.year.days; }
function lerpAge(y, y0, y1, v) { return v[0] + (v[1] - v[0]) * clamp((y - y0) / (y1 - y0), 0, 1); }
function isInfant(a) { return a.child && ageYears(a) < PARAMETERS.life.nurseAge; }

// a child's share of an adult's work rate (0 before it helps) and of an adult's food need
function workRate(a) {
  if (!a.child) return 1;
  const L = PARAMETERS.life, y = ageYears(a);
  return y < L.helpAge ? 0 : lerpAge(y, L.helpAge, L.matureAge, L.childRate);
}
// the daily food need as a share of an adult's: a child's by age; a mother's raised late in
// pregnancy and by each infant she nurses
function foodScale(a) {
  const L = PARAMETERS.life;
  if (a.child) return lerpAge(ageYears(a), L.nurseAge, L.matureAge, L.childFood);
  let s = 1;
  if (a.pregnant && a.pregnant.due - L.lateDays <= a.pregnant.today) s += L.lateFood;
  for (const c of a.charges) if (isInfant(c)) s += L.milkFood;
  return s;
}
// hours a day the agent's charges and late pregnancy take from it (care is labor drawn from
// rest, ODD §2)
function careLoad(a) {
  const L = PARAMETERS.life;
  let h = a.pregnant && a.pregnant.due - L.lateDays <= a.pregnant.today ? L.lateHours : 0;
  for (const c of a.charges) {
    const y = ageYears(c);
    h += L.careHours[y < L.nurseAge ? 0 : y < L.helpAge ? 1 : 2];
  }
  return h;
}
// the care its charges take of `hours`: never the hours it needs to drink (its drink trip); the
// care those hours cannot cover lapses (ODD §7.4 A hurt carer puts her own recovery first,
// Decided 2026-11-16)
function careTaken(a, hours) { return Math.min(careLoad(a), Math.max(0, hours - a.drinkTrip)); }
function nursesOwn(a) { return a.female && a.charges.some((c) => c.mother === a && isInfant(c)); }

// ── a parent's weight on its child's needs (ODD §7.4, Decided 2026-11-06) ────────────────
// The share of its belonging it expects a grown child to supply — learned from its own grown
// children, or before it has any, the share its strongest tie supplies now — times its
// learned chance that a child lives to grow up. The real tie weight takes over once larger.
function strongestTie(a, day) {
  let s = 0, best = null, m = 0;
  for (const [k] of a.ties) {
    const t = a.tie(k, day), b = Math.min(t.kind, t.given);
    s += b;
    if (b > m) { m = b; best = t; }
  }
  return best ? { t: best, bond: m, w: m / Math.max(s, PARAMETERS.exchange.belongingSet) } : null;
}
// The chance is learned as a death rate per year of childhood watched, so children still
// growing count for the years they have lived (counting only those grown or dead made every
// estimate in the first 15 years a count of deaths alone, 2026-11-06).
function survivalChance(a) {
  const P = PARAMETERS.life.survivalPrior, S = a.childSeen;
  return Math.exp(-PARAMETERS.life.matureAge * (S.died + P.died) / (S.years + P.years));
}
function expectedChildWeight(a, day) {
  const L = a.childL;
  const grown = L.nh > 0 || L.nn > 0 ? L.v : (strongestTie(a, day) || { w: 0 }).w;
  return grown * survivalChance(a);
}
function isParent(a, c) { return c.mother === a || c.father === a; }
// i's weight on j's needs: its tie to j, or as j's parent its valuation of the child
function weightOn(i, j, day) {
  const w = i.tieWeight(j.id, day);
  return j.child && isParent(i, j) ? Math.max(w, expectedChildWeight(i, day)) : w;
}

// How a gift from i to j is judged and booked (ODD §2, §7.4):
// - to its own child: by its weight on the child; no grudge, and it stays out of the owing
//   balance (care is an investment); kindness in the child's tally;
// - to someone else's child: as a gift to the child's keeper (its mother, or whoever took
//   her place), by i's tie to the keeper; it counts as a kind offer to the keeper (her tally
//   of i and what she owes rise) and as kindness in the child's tally, never a grudge
//   against the child;
// - otherwise, a gift between ties as before.
// Returns null when i will not consider giving.
function giftTerms(i, j, day) {
  if (j.child && isParent(i, j)) return { weight: weightOn(i, j, day), via: null, parent: true };
  const k = j.child ? j.keeper : null;
  if (k && k !== i && k.alive) {
    if (!(i.trust(k.id, day) > 0) || i.grudge(k.id, day)) return null;
    return { weight: i.tieWeight(k.id, day), via: k, parent: false };
  }
  if (!(i.trust(j.id, day) > 0) || i.grudge(j.id, day)) return null;
  return { weight: i.tieWeight(j.id, day), via: null, parent: false };
}
function bookGift(i, j, terms, day) {
  if (terms.parent) {
    const t = i.tie(j.id, day); t.given += 1; t.n++;
    const u = j.tie(i.id, day); u.kind += 1; u.n++;
  } else if (terms.via) {
    i.gave(terms.via.id, day);
    terms.via.received(i.id, day);
    const u = j.tie(i.id, day); u.kind += 1; u.n++;
  } else {
    i.gave(j.id, day);
    j.received(i.id, day);
  }
}

// ── the day of a child with a carer (ODD §2: it goes with its carer) ───────────────────────
// After its carer has acted: it was where its carer was, and was cared for (a kind offer in its
// tally; in the carer's, given). From helpAge its help at the carer's task (added to the
// carer's haul in act) is a kind offer to the carer. It shares its carer's drinking (one drink,
// her gourd included); from weaning it also drinks for itself at water anywhere it was with
// her, camp included (ODD §7.4 Children drink and eat on their own, Decided 2026-11-16).
function followCarer(c, world) {
  const k = c.carer, day = world.day;
  c.home = k.home; c.shelter = k.shelter; c.camp = null;
  c.places = k.places.slice();
  c.drank = k.drank;
  if (!c.drank && !isInfant(c)) {
    for (const h of c.places) {
      const src = h >= 0 ? world.waterAt[h] : -1;
      if (src >= 0 && world.stock.water[src] > 0) { world.take('water', src, PARAMETERS.goods.drinkDraw); c.drank = true; break; }
    }
  }
  c.busy = workRate(c) > 0 ? k.busy : 0;
  c.plan = []; c.obs = []; c.practised = [];
  for (const g of FLOW_GOODS) c.got[g] = 0;
  const t = k.tie(c.id, day); t.given += 1; t.n++;
  const u = c.tie(k.id, day); u.kind += 1; u.n++;
  if (c.helped) {
    t.kind += 1;
    u.given += 1;
    c.helped = false;
  }
}

// A dependent's evening: warmth as its carer's (one fire, one bed); its water as its carer's,
// or full where it drank for itself (followCarer); an infant's food as its nursing carer's
// (milk), an older child's from what it holds.
function dependentEvening(c, world) {
  const k = c.carer;
  if (k) {
    c.need.warmth = k.need.warmth; c.coldDays = k.coldDays;
    c.need.water = c.drank && !isInfant(c) ? 1 : k.need.water;
  }
  if (isInfant(c)) {
    const N = PARAMETERS.needs;
    // an infant's carer is always a nursing woman (its mother, or one who took it on)
    c.need.food = k ? k.need.food : Math.max(-needReserve('food'), c.need.food - N.foodDecay);   // no milk
    if (!k) { c.need.water = Math.max(-needReserve('water'), c.need.water - N.waterDecay); c.need.warmth = 0; c.coldDays++; }
  } else {
    const out = Agent.evening(c.need, c.hold, shelterIns(c.shelter), c.busy, true,
      world.season().cold, PARAMETERS.agents.wakingHours, 1, foodScale(c));
    c.need.food = Math.max(-needReserve('food'), out.food);
    for (const g of FOODS) c.hold[g] = out.hold[g] * (1 - PARAMETERS.goods[g].rot);
  }
  c.need.rest = 1;
  c.need.belonging = c.belonging(world.day);
}

// ── births, maturity, and a child passed on (ODD §2, §7.4) ───────────────────────────────
function giveBirth(world, m) {
  const P = m.pregnant;
  m.pregnant = null;
  const c = new Agent(world.nextId++, m.home, world, { born: true });
  c.mother = m; c.father = P.father; c.carer = m; c.keeper = m;
  c.band = m.band; c.shelter = m.shelter; c.camp = null;
  m.charges.push(c);
  m.kids.push(c);
  if (P.father) P.father.kids.push(c);
  world.agents.push(c);
  world.births = (world.births || 0) + 1;
}

// grown: it plans and works on its own, and takes a bed of its own at its carer's camp
function mature(world, c) {
  const k = c.carer;
  c.child = false;
  if (k) k.charges.splice(k.charges.indexOf(c), 1);
  c.carer = null; c.keeper = null;
  if (c.camp == null) joinCamp(world, c, k);
  childSeen(world, c, 'grown');
  for (const p of [c.mother, c.father]) if (p && p.alive) learnOwn(p.childL, p.tieWeight(c.id, world.day), PARAMETERS.agents.learnRate);
  world.matured = (world.matured || 0) + 1;
}
function joinCamp(world, c, near) {
  if (world.camps) {
    const camp = (near && near.camp && world.camps.includes(near.camp) ? near.camp : null) ||
      world.camps.find((x) => x.hex === c.home) || null;
    if (camp) { c.shelter = { sleepers: [] }; world.moveTo(c, camp, 0); return; }
  }
  c.shelter = world.dwellings ? world.newDwelling(c.home, c.id) : newShelter(c.home);
}

// A child grown or dead, or a year of a child's life: its parents, and everyone with a tie
// to its keeper, see it (the chance a child grows up is learned from the children one has
// seen, ODD §7.4). `what` is 'grown', 'died' or 'years'.
function childSeen(world, c, what) {
  const k = c.keeper || c.mother, day = world.day;
  for (const a of world.agents) {
    if (a === c || a.child || !a.alive) continue;
    if (isParent(a, c) || (k && a.ties.has(k.id) && a.trust(k.id, day) > 0)) a.childSeen[what]++;
  }
}

// Its carer has died (ODD §2, Decided 2026-11-04): the child passes to the adult it is most
// strongly tied to among those willing (Default: an adult whose weight on the child is above
// zero, by its own tie, as a parent, or through its tie to the child's keeper); a nursing
// infant only to a woman nursing an infant of her own. With no one willing it is untended:
// from helpAge it plans its own day at a child's rate; younger, it lives on gifts.
function passOn(world, c, dead) {
  const day = world.day, infant = isInfant(c), k0 = c.keeper;
  let best = null, bt = -1, bw = 0;
  for (const a of world.agents) {
    if (a === dead || !a.alive || a.child) continue;
    if (infant && !nursesOwn(a)) continue;
    const w = Math.max(weightOn(a, c, day), k0 && k0 !== a ? a.tieWeight(k0.id, day) : 0);
    if (!(w > 0)) continue;
    const t = c.trust(a.id, day);
    if (t > bt || (t === bt && w > bw)) { best = a; bt = t; bw = w; }
  }
  c.carer = best;
  if (best) { c.keeper = best; best.charges.push(c); world.fostered = (world.fostered || 0) + 1; return; }
  world.untended = (world.untended || 0) + 1;
  if (workRate(c) > 0) joinCamp(world, c, dead);
}

// ── conception (ODD §7.4, Decided 2026-11-05) ────────────────────────────────────────────
// Each month a woman free to conceive (fertile, not pregnant, nursing no infant) weighs a
// child with each fertile man at her camp she has a tie to, picks the one with the best
// return, and if his return is positive too they try; a month's trying conceives with chance
// `conceive`. A failed month binds no one.
function canConceive(f, day) {
  const L = PARAMETERS.life, y = ageYears(f);
  return f.female && !f.child && !f.pregnant && y >= L.fertile.female[0] && y <= L.fertile.female[1] && !f.charges.some(isInfant) &&
    !(day < (f.fertileFrom || 0));
}
function conceptionDay(world) {
  const L = PARAMETERS.life, day = world.day;
  for (const f of world.agents) {
    if (!canConceive(f, day)) continue;
    const pool = f.camp ? f.camp.members : world.agents.filter((a) => a.home === f.home);
    let best = null, bestR = 0;
    for (const m of pool) {
      if (m.female || m.child || !m.alive || ageYears(m) < L.fertile.male || !(f.trust(m.id, day) > 0)) continue;
      const r = childReturn(f, world, m);
      if (r > bestR) { bestR = r; best = m; }
    }
    world.weighed = (world.weighed || 0) + 1;
    if (!best || !(childReturn(best, world, f) > 0)) continue;
    world.tries = (world.tries || 0) + 1;
    if (world.rng() < L.conceive) {
      f.pregnant = { father: best, due: day + L.pregnancyDays, today: day };
      world.conceptions = (world.conceptions || 0) + 1;
    }
  }
}

// A parent's expected return on a child, in hours (ODD §4.3: costs are measured in hours;
// §7.4: the prior from experience). The return: the bond a grown child would be, judged by
// what its strongest tie gives it now (gifts of food, and the belonging that tie meets), over
// the years it expects to live once the child is grown; and, for the mother as carer, the
// child's help from helpAge at its own working day. Both are times its chance the child grows
// up. The cost, the mother's alone (nothing obliges the father): late pregnancy, nursing,
// care hours and the child's food, less what she expects the father to give, graded by his
// kindness to her (the food his gifts have brought her).
function childReturn(p, world, partner) {
  const L = PARAMETERS.life, Y = PARAMETERS.year.days, N = PARAMETERS.needs, day = world.day;
  const fh = hoursPerFood(p, world);
  const st = strongestTie(p, day);
  let bondDay = 0;
  if (st) {
    const b = p.need.belonging, b2 = clamp(b - st.bond / PARAMETERS.exchange.belongingSet, 0, 1);
    const sq = (x) => (1 - x) * (1 - x);
    bondDay = st.t.food / tieMemory(st.t) * fh + (sq(b2) - sq(b)) * N.restSet / 2;
  }
  const surv = survivalChance(p);
  let ret = surv * expectedYears(p, ageYears(p) + L.matureAge) * Y * bondDay;
  if (!p.female) return ret;
  let work = 0;
  for (const H of p.busyHabit) work += H.v / 4;
  let help = 0, care = 0;
  for (let y = 0; y < L.matureAge; y++) {
    const c = { child: true, ageDays: (y + 0.5) * Y };
    help += workRate(c) * work;
    care += L.careHours[y < L.nurseAge ? 0 : y < L.helpAge ? 1 : 2] +
      (y < L.nurseAge ? L.milkFood : foodScale(c)) * N.foodDecay * fh;
  }
  ret += surv * help * Y;
  const preg = L.lateDays * (L.lateHours + L.lateFood * N.foodDecay * fh);
  const t = p.ties.get(partner.id);
  const fromHim = t ? Math.min(care * Y, t.food / tieMemory(t) * fh * L.matureAge * Y) : 0;
  return ret - (preg + care * Y - fromHim) - crowding(p, fh, work);
}
// A child's net hours a day on its carer at age `y` years: its care and its food at the carer's
// hour cost, less its help at the carer's work; nothing once grown
function childHours(y, fh, work) {
  const L = PARAMETERS.life, N = PARAMETERS.needs;
  if (y >= L.matureAge) return 0;
  const c = { child: true, ageDays: y * PARAMETERS.year.days };
  return L.careHours[y < L.nurseAge ? 0 : y < L.helpAge ? 1 : 2] +
    (y < L.nurseAge ? L.milkFood : foodScale(c)) * N.foodDecay * fh - workRate(c) * work;
}
// The rest another child takes from a day the children in her care already fill (ODD §7.4 She
// counts the children she already has, Decided — Chris, 2026-11-13; as built, Default): each
// year of its childhood, its net hours come out of her free hours (her day's capacity less her
// usual work, which holds her charges' care and food today; growing back as they grow up), at
// the rest need's cost, valued in hours as belonging is above. No floor at zero rest.
function crowding(p, fh, work) {
  const L = PARAMETERS.life, N = PARAMETERS.needs, Y = PARAMETERS.year.days;
  const rc = (F) => { const x = Math.min(1, F / N.restSet); return (1 - x) * (1 - x); };
  const kids = p.charges.filter((c) => c.alive && c.child).map(ageYears);
  const load = (dy) => kids.reduce((s, a) => s + childHours(a + dy, fh, work), 0);
  const F0 = workingHours(p) - careLoad(p) - work + load(0);   // free hours before her charges
  let cost = 0;
  for (let y = 0; y < L.matureAge; y++) {
    const F = F0 - load(y + 0.5), h = childHours(y + 0.5, fh, work);
    cost += (rc(F - h) - rc(F)) * N.restSet / 2;
  }
  return cost * Y;
}
// hours per unit of food (the cheapest food to hand, ODD §7.2 hour costs)
function hoursPerFood(a, world) {
  const out = hourCosts(a, world), G = PARAMETERS.goods;
  let best = Infinity;
  for (const k of FOODS) if (out[k] / G[k].restores < best) best = out[k] / G[k].restores;
  return best < Infinity ? best : 10;
}
function tieMemory(t) { const E = PARAMETERS.exchange; return E.tallyMemory * (1 + t.n / E.familiarity); }
// years it expects to live beyond age `from`, by the old-age hazard (Gompertz, ODD §2)
function expectedYears(a, from) {
  const O = PARAMETERS.agents.oldAge, now = ageYears(a);
  const H = (x) => (O.gompertzA / O.gompertzB) * Math.exp(O.gompertzB * x);
  let s = 0;
  for (let y = from; y < 110; y += 1) s += Math.exp(-(H(y + 0.5) - H(now)));
  return s;
}

// ── once a day, after the deaths ─────────────────────────────────────────────────────────
function lifeDay(world, died) {
  const L = PARAMETERS.life;
  for (const d of died) {
    if (d.child) childSeen(world, d, 'died');
    for (const c of d.charges.slice()) if (c.alive) passOn(world, c, d);
    d.charges = [];
    if (d.carer) { const k = d.carer.charges; const i = k.indexOf(d); if (i >= 0) k.splice(i, 1); }
  }
  if (world.day % PARAMETERS.year.days === 0) for (const c of world.agents) if (c.child) childSeen(world, c, 'years');
  if (!L.on) return;
  for (const a of world.agents.slice()) {
    if (a.pregnant) { a.pregnant.today = world.day; if (world.day >= a.pregnant.due) giveBirth(world, a); }
    if (a.child && ageYears(a) >= L.matureAge) mature(world, a);
  }
  if (world.day % L.month === 0) conceptionDay(world);
}
