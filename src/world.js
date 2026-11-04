'use strict';
// The world holds all state and advances it one day per update (ODD §2 Scales: one tick =
// one day): the landscape (hex map, resources, seasons, travel times), the agents' day,
// camps, dwellings and fields. It is an engine entity (has update) but draws nothing:
// rendering is the Observer's job.
//
// Construct with `new World()` to generate a map from PARAMETERS.seed, or
// `new World({ map })` with a map from exportMap() to hold one map fixed (ODD §2: some
// experiments fix one map).
var World = class World {
  constructor(opts) {
    opts = opts || {};
    const P = PARAMETERS;
    this.rng = makeRng(P.seed);
    if (opts.map) {
      const m = opts.map;
      this.grid = new HexGrid(m.width, m.height);
      this.terrain = Uint8Array.from(m.terrain);
      this.spring = Uint8Array.from(m.spring);
      this.caps = {};
      for (const k in m.caps) this.caps[k] = Float32Array.from(m.caps[k]);
      this.centres = m.centres || {};
    } else {
      this.grid = new HexGrid(P.map.width, P.map.height);
      const g = generateMap(this.grid, P, this.rng);
      this.terrain = g.terrain;
      this.spring = g.spring;
      this.caps = g.caps;
      this.centres = g.centres;
    }
    // hours to cross each hex (-1 impassable), from terrain
    this.hours = new Float32Array(this.grid.n);
    for (let i = 0; i < this.grid.n; i++) this.hours[i] = P.terrainHours[TERRAIN[this.terrain[i]]];

    // stocks start full; `active` lists the hexes where a resource exists, so a day's
    // regrowth touches only those
    this.stock = {};
    this.active = {};
    for (const k in this.caps) {
      this.stock[k] = Float32Array.from(this.caps[k]);
      const a = [];
      for (let i = 0; i < this.grid.n; i++) if (this.caps[k][i] > 0) a.push(i);
      this.active[k] = Int32Array.from(a);
    }
    this.day = 0;
    this.seasonIndex = 0;   // set each update; spring before the first
    this.travelCache = new Map();
    // where an agent standing in each hex can drink: the hex itself, or a river or lake
    // beside it (lakes can't be entered, but their shores can be drunk from); -1 if neither
    this.waterAt = new Int32Array(this.grid.n).fill(-1);
    for (let i = 0; i < this.grid.n; i++) {
      if (this.hours[i] < 0) continue;
      if (this.caps.water[i] > 0) { this.waterAt[i] = i; continue; }
      for (let d = 0; d < 6; d++) {
        const m = this.grid.nbr[i * 6 + d];
        if (m >= 0 && this.caps.water[m] > 0) { this.waterAt[i] = m; break; }
      }
    }

    // agents (Stage 2: solitary, placed near water as a test setup; band layout is Stage 7)
    this.agents = [];
    this.dead = [];
    // know-how events (ODD §7.3) and goods made, for measures and tests
    this.discoveries = [];
    // fields (Stage 5d): this year's, and the ripe grain standing in each hex
    this.fields = [];
    this.grainHex = new Float32Array(this.grid.n);
    this.learnedBySeeing = [];
    this.dwellings = [];   // lean-tos and huts, lived in or empty (ODD §5 Moving camp)
    this.giftAmounts = {};
    this.made = {};
    if (opts.agents != null) this.placeAgents(opts.agents);
    else if (PARAMETERS.agents.layout === 'bands') this.placeBands(PARAMETERS.agents.bands);
    else this.placeAgents(PARAMETERS.agents.n);
  }

  // Bands a day or two apart (ODD §5): centres on land within a hex of water, at least
  // `spacing` hexes apart; each member's home within `radius` hexes of its centre.
  placeBands(B) {
    const g = this.grid, cand = [];
    const land = (i) => this.terrain[i] === T_PLAINS || this.terrain[i] === T_FOREST;
    for (let i = 0; i < g.n; i++) {
      if (land(i) && g.within(i, 1).some((m) => this.terrain[m] === T_RIVER || this.terrain[m] === T_LAKE)) cand.push(i);
    }
    this.bandCentres = [];
    for (let tries = 0; tries < 2000 && this.bandCentres.length < B.n && cand.length; tries++) {
      const c = cand[this.rng.int(cand.length)];
      if (this.bandCentres.every((b) => g.dist(b, c) >= B.spacing)) this.bandCentres.push(c);
    }
    // with moving camp, the camp is one hex holding the band's homes (ODD §5, Decided)
    const moving = PARAMETERS.camp.move;
    if (moving) this.camps = [];
    for (let b = 0; b < this.bandCentres.length; b++) {
      const homes = moving ? [this.bandCentres[b]]
        : g.within(this.bandCentres[b], B.radius).filter((h) => this.hours[h] >= 0 && this.terrain[h] !== T_RIVER);
      const camp = moving ? { hex: this.bandCentres[b], members: [] } : null;
      if (camp) this.camps.push(camp);
      for (let k = 0; k < B.size; k++) {
        const a = new Agent(this.agents.length, homes[this.rng.int(homes.length)], this);
        a.band = b;
        if (camp) { a.camp = camp; camp.members.push(a); }
        this.agents.push(a);
      }
    }
  }

  // ── moving camp (ODD §5, Decided — Chris, 2026-11-03) ──────────────────────────────────
  // Every `every` days each camp weighs moving. Candidate sites are land beside water within a
  // day's walk; the shortlist is the sites whose surroundings the members have seen fullest
  // of plants and wood. Each member scores each site by the cost of its own best day there
  // (siteDay). The band moves to the site with the lowest summed cost when, over the days
  // until it weighs again, that beats staying by more than the moving day costs (the walk
  // there). Then each member chooses for itself: follow, stay, or join another camp within
  // reach, whichever costs it least over those days, with the ties it would leave behind
  // costed through belonging. No leader: the rule makes a group decision but not who decides.
  campsDay() {
    const C = PARAMETERS.camp, n = C.every;
    const tab = projectionTable(this);
    let K = 1;   // weight of a day's belonging in a day's cost (tonight and the projection)
    for (const T of tab) K += T.beta * T.len;
    const sq = (x) => (1 - x) * (1 - x);
    for (const camp of this.camps.slice()) {
      if (!camp.members.length || camp.movedDay === this.day) continue;
      const M = camp.members, tr = this.travel(camp.hex);
      const stay = M.map((a) => siteDay(a, this, camp.hex, 0));
      const sStay = stay.reduce((x, y) => x + y, 0);
      let best = -1, bestDay = null, bestSum = sStay;
      for (const s of this.campSites(camp)) {
        const d = M.map((a) => siteDay(a, this, s, 0));
        const sum = d.reduce((x, y) => x + y, 0);
        if (sum < bestSum) { best = s; bestDay = d; bestSum = sum; }
      }
      if (best < 0) continue;
      const arrive = M.map((a) => siteDay(a, this, best, tr[best]));
      const sArrive = arrive.reduce((x, y) => x + y, 0);
      if (!(sArrive + (n - 1) * bestSum < n * sStay)) continue;
      // each member's own choice
      const others = this.camps.filter((c) => c !== camp && c.members.length && c.hex !== best && c.hex !== camp.hex && tr[c.hex] <= PARAMETERS.agents.wakingHours);
      const atBest = this.camps.find((c) => c !== camp && c.hex === best);
      const stayers = this.camps.filter((c) => c !== camp && c.hex === camp.hex).flatMap((c) => c.members);
      const goers = M.concat(atBest ? atBest.members : []);
      const choice = new Map();
      M.forEach((a, k) => {
        const b0 = a.need.belonging, adj = (b) => n * K * (sq(b) - sq(b0));
        let pick = 'follow', c = arrive[k] + (n - 1) * bestDay[k] + adj(a.belongingWith(goers, this.day));
        const cStay = n * stay[k] + adj(a.belongingWith(stayers, this.day));
        if (cStay < c) { pick = 'stay'; c = cStay; }
        for (const o of others) {
          const cJoin = siteDay(a, this, o.hex, tr[o.hex]) + (n - 1) * siteDay(a, this, o.hex, 0) + adj(a.belongingWith(o.members, this.day));
          if (cJoin < c) { pick = o; c = cJoin; }
        }
        choice.set(a, pick);
      });
      const followers = M.filter((a) => choice.get(a) === 'follow');
      const left = M.filter((a) => choice.get(a) === 'stay');
      this.campMoves = (this.campMoves || 0) + 1;
      if (left.length) this.campSplits = (this.campSplits || 0) + 1;
      // followers move (to a camp already there, if there is one); stayers keep the old camp
      let dest = atBest;
      if (!dest) { dest = { hex: best, members: [] }; this.camps.push(dest); }
      dest.movedDay = this.day;
      for (const a of followers) this.moveTo(a, dest, tr[best]);
      for (const a of M) {
        const o = choice.get(a);
        if (typeof o === 'object') { this.moveTo(a, o, tr[o.hex]); this.campJoins = (this.campJoins || 0) + 1; }
      }
      camp.members = left;
    }
    this.camps = this.camps.filter((c) => c.members.length);
  }

  // An agent walks to a camp and makes its home there: its dwelling is left behind (for
  // anyone), it sleeps in the best one with room at the camp or on bare ground of its own, and
  // it sees the land around the new home.
  moveTo(a, camp, walk) {
    this.leaveDwelling(a);
    a.settle(this, camp.hex);
    const d = this.bestDwelling(camp.hex, a);
    if (d) { d.sleepers.push(a.id); a.shelter = d; } else a.shelter = this.newDwelling(camp.hex, a.id);
    a.walked = Math.min(walk, a.capacity());
    a.camp = camp;
    camp.members.push(a);
    for (const h of this.grid.within(camp.hex, PARAMETERS.agents.sight)) a.look(this, h);
  }

  // Dwellings (ODD §5 Moving camp, Decided: things in the world; a hut shelters several, who
  // share by choice).
  newDwelling(hex, id) {
    const d = newShelter(hex);
    d.sleepers.push(id);
    this.dwellings.push(d);
    return d;
  }
  leaveDwelling(a) {
    const s = a.shelter.sleepers, k = s.indexOf(a.id);
    if (k >= 0) s.splice(k, 1);
  }
  // beds left in a dwelling: a hut once begun holds more than a lean-to or bare ground
  dwellingRoom(d) {
    const G = PARAMETERS.goods;
    return (d.hut > 0 ? G.hut.sleepers : G.leanTo.sleepers) - d.sleepers.length;
  }
  // how strongly `a` is tied to those sleeping in `d`
  tiedTo(a, d) {
    let s = 0;
    for (const id of d.sleepers) if (id !== a.id && a.ties.has(id)) s += a.tie(id, this.day).kind;
    return s;
  }
  // Of two places to sleep, is `d` better for `a` than `cur`? Noticeably warmer; or about as
  // warm and among those it is more strongly tied to.
  betterBed(a, d, cur) {
    if (!cur) return true;
    const di = shelterIns(d), ci = shelterIns(cur), E = PARAMETERS.camp.warmer;
    if (di > ci + E) return true;
    return di >= ci - E && this.tiedTo(a, d) > this.tiedTo(a, cur);
  }
  // the best dwelling with room for `a` at a hex, other than its own; null if none
  bestDwelling(hex, a) {
    let best = null;
    for (const d of this.dwellings) {
      if (d.hex !== hex || d === a.shelter || this.dwellingRoom(d) <= 0) continue;
      if (this.betterBed(a, d, best)) best = d;
    }
    return best;
  }
  // Each evening each agent at a camp moves to a better bed there if one has room (ODD §5):
  // no one is turned out, and an agent stays put unless the move is better.
  bedDown(order) {
    for (const a of order) {
      if (!a.camp) continue;
      const d = this.bestDwelling(a.home, a);
      if (!d || !this.betterBed(a, d, a.shelter)) continue;
      this.leaveDwelling(a);
      d.sleepers.push(a.id);
      a.shelter = d;
      this.bedMoves = (this.bedMoves || 0) + 1;
    }
  }
  // empty dwellings weather as lived-in ones do (Agent.consume); a dwelling with nothing left
  // and no one in it is gone
  wearDwellings() {
    for (const d of this.dwellings) if (!d.sleepers.length) wearShelter(d, 1);
    this.dwellings = this.dwellings.filter((d) => d.sleepers.length || d.leanTo > 0 || d.hut > 0);
  }

  // The shortlist of sites a camp weighs: land beside water within a day's walk, ranked by
  // how full of plants and wood the members last saw the land within `look` hexes of it.
  campSites(camp) {
    const C = PARAMETERS.camp, tr = this.travel(camp.hex), M = camp.members, out = [];
    for (let h = 0; h < this.grid.n; h++) {
      if (h === camp.hex || !(tr[h] <= PARAMETERS.agents.wakingHours) || this.waterAt[h] < 0) continue;
      if (this.terrain[h] !== T_PLAINS && this.terrain[h] !== T_FOREST) continue;
      let score = 0;
      for (const m of this.grid.within(h, C.look)) {
        const p = this.caps.plants[m] > 0, w = this.caps.wood[m] > 0;
        if (!p && !w) continue;
        for (const a of M) {
          if (!a.known[m]) continue;
          if (p) score += a.seenFrac[A_FORAGE][m];
          if (w) score += a.seenFrac[A_WOOD][m];
        }
      }
      out.push({ h, score });
    }
    out.sort((x, y) => y.score - x.score);
    return out.slice(0, C.sites).map((x) => x.h);
  }

  placeAgents(n) {
    const g = this.grid, cand = [];
    for (let i = 0; i < g.n; i++) {
      const t = this.terrain[i];
      if (t !== T_PLAINS && t !== T_FOREST) continue;
      if (g.within(i, 1).some((m) => this.terrain[m] === T_RIVER || this.terrain[m] === T_LAKE)) cand.push(i);
    }
    for (let k = 0; k < n && cand.length; k++) {
      const j = this.rng.int(cand.length);
      this.agents.push(new Agent(this.agents.length, cand[j], this));
      cand.splice(j, 1);
    }
  }

  // ── seasons ────────────────────────────────────────────────────────────────────────────
  // phase 0 = start of spring. growth > 0 in spring and summer only; rain peaks in spring;
  // cold > 0 in autumn and winter (for the warmth need, Stage 2).
  season(day) {
    if (day == null) day = this.day;
    const Y = PARAMETERS.year;
    const phase = (day % Y.days) / Y.days;
    const s = Math.sin(TAU * phase), c = Math.cos(TAU * phase);
    return {
      phase,
      name: ['spring', 'summer', 'autumn', 'winter'][Math.floor(phase * 4)],
      // a floor of winter growth stands in for winter food the v0 tree leaves out (hunting,
      // fishing, roots); without it half the year has no food at all
      growth: Math.max(Y.winterGrowth, s),
      rain: 1 + Y.rainAmplitude * c,
      cold: Math.max(0, -s),
    };
  }

  // ── one day ────────────────────────────────────────────────────────────────────────────
  update() {
    this.day++;
    const sea = this.season();
    this.seasonIndex = Math.floor(sea.phase * 4);
    for (const k in this.caps) {
      const R = PARAMETERS.resources[k];
      const f = R.season === 'growth' ? sea.growth : (R.season === 'rain' ? sea.rain : 1);
      const cap = this.caps[k], st = this.stock[k], act = this.active[k];
      if (R.kind === 'renewable') {
        // logistic regrowth toward cap; the seed floor lets a stripped hex come back slowly
        if (f <= 0) continue;
        for (let j = 0; j < act.length; j++) {
          const i = act[j], K = cap[i], s = st[i];
          const g = R.r * f * Math.max(s, R.floor * K) * (1 - s / K);
          st[i] = Math.min(K, s + g);
        }
      } else if (R.kind === 'flow') {
        // refills each day toward the season's level; doesn't pool beyond it
        for (let j = 0; j < act.length; j++) {
          const i = act[j], level = cap[i] * f;
          st[i] = Math.min(level, st[i] + R.inflow * level);
        }
      }
      // deposits never regrow
    }
    this.fieldsDay();
    if (this.agents.length) this.agentDay();
  }

  // ── farming (Stage 5d; ODD §2: anyone may harvest a planted field) ──────────────────────
  // Fields ripen on one day of the year, decay in the field after, and close later; at the
  // close each planter learns what came back to it per seed (its own reaping and grain gifted
  // by those who reaped the field, up to what each reaped there).
  fieldsDay() {
    const G = PARAMETERS.goods.grain, doy = this.day % PARAMETERS.year.days;
    if (!this.fields.length) return;
    if (doy === G.ripeDay) {
      // a planter knows when its own field ripens (ODD §5 Moving camp, Default)
      for (const f of this.fields) { f.grain = f.yield; f.ripe = true; f.planter.seenGrain[f.hex] = f.yield; }
    }
    else if (doy > G.ripeDay) for (const f of this.fields) f.grain *= 1 - G.fieldDecay;
    if (doy >= G.closeDay) {
      for (const f of this.fields) {
        const back = (f.reaped.get(f.planter.id) || 0) + f.returned;
        if (f.planter.alive) f.planter.learnFarm(back / (f.seeds * f.fert));
        const k = f.planter.fields.indexOf(f);
        if (k >= 0) f.planter.fields.splice(k, 1);
      }
      this.fields = [];
    }
    this.grainHex.fill(0);
    for (const f of this.fields) if (f.ripe) this.grainHex[f.hex] += f.grain;
  }
  // land that can be farmed: plains or hills with soil (forest needs clearing, not built yet)
  canFarm(hex) {
    const t = this.terrain[hex];
    return (t === T_PLAINS || t === T_HILLS) && this.caps.soil[hex] > 0;
  }
  // sowing is in spring
  canSow(hex) { return this.season().phase < 0.25 && this.canFarm(hex); }
  fertility(hex) { return this.stock.soil[hex] / PARAMETERS.goods.grain.soilFull; }
  sow(agent, hex, seeds) {
    const G = PARAMETERS.goods.grain, fert = this.fertility(hex);
    this.take('soil', hex, seeds * G.soilPerSeed);
    let f = agent.fields.find((x) => x.hex === hex);
    if (!f) {
      f = { hex, planter: agent, seeds: 0, fert: 0, yield: 0, grain: 0, ripe: false, reaped: new Map(), credited: new Map(), returned: 0 };
      agent.fields.push(f); this.fields.push(f);
    }
    f.fert = (f.fert * f.seeds + fert * seeds) / (f.seeds + seeds);
    f.seeds += seeds;
    f.yield += seeds * G.yieldPerSeed * fert;
    this.sown = (this.sown || 0) + seeds;
  }
  reap(agent, hex, want) {
    const here = this.fields.filter((f) => f.hex === hex && f.grain > 0);
    here.sort((a, b) => (b.planter === agent) - (a.planter === agent));   // its own first
    let got = 0;
    for (const f of here) {
      const t = Math.min(f.grain, want - got);
      if (!(t > 0)) break;
      f.grain -= t; got += t;
      f.reaped.set(agent.id, (f.reaped.get(agent.id) || 0) + t);
      this.grainHex[hex] -= t;
    }
    this.reaped = (this.reaped || 0) + got;
    return got;
  }
  // grain given by `giver` to `receiver` counts toward the receiver's fields that the giver
  // reaped, up to what it reaped there (ODD §2, Chris: a friend reaps and gives a share back)
  creditReturn(giver, receiver, qty) {
    for (const f of receiver.fields) {
      if (!(qty > 0)) break;
      const r = (f.reaped.get(giver.id) || 0) - (f.credited.get(giver.id) || 0);
      if (!(r > 0)) continue;
      const c = Math.min(qty, r);
      f.credited.set(giver.id, (f.credited.get(giver.id) || 0) + c);
      f.returned += c; qty -= c;
      this.returnedGrain = (this.returnedGrain || 0) + c;
    }
  }

  // The agents' day in synchronized phases (ODD §3): every agent finishes a phase before
  // any starts the next. Travel and work run in a random order reshuffled daily, which is
  // the order contested hexes are drawn from.
  agentDay() {
    const live = this.agents;
    if (this.camps && PARAMETERS.camp.move && this.day % PARAMETERS.camp.every === 0) this.campsDay();   // moving camp
    for (const a of live) a.plan = planDay(a, this);                 // 1. Plan
    const order = live.slice();
    for (let i = order.length - 1; i > 0; i--) {                       // 2. Travel and work
      const j = this.rng.int(i + 1);
      const t = order[i]; order[i] = order[j]; order[j] = t;
    }
    for (const a of order) a.act(this);
    this.meet(live);                                                   //    meeting and chat
    this.giftsToday = 0;
    for (const a of live) a.xnet = { food: -a.hold.food, wood: -a.hold.wood };
    exchangeDay(this, live);                                          // 3. Exchange
    for (const a of live) { a.xnet.food += a.hold.food; a.xnet.wood += a.hold.wood; }   // net in exchange
    if (this.camps) this.bedDown(order);                              //    where to sleep
    for (const a of live) a.consume(this);                            // 4. Consume
    for (const a of live) a.learn();                                  // 5. Learn
    for (const a of live) a.age(this);                                // 6. Aging and deaths
    for (const a of live) if (!a.alive) { a.deathDay = this.day; this.dead.push(a); this.leaveDwelling(a); }
    this.wearDwellings();
    this.agents = live.filter((a) => a.alive);
    if (this.camps) {
      for (const c of this.camps) c.members = c.members.filter((a) => a.alive);
      this.camps = this.camps.filter((c) => c.members.length);
    }
  }

  // Meeting is co-location (ODD §3): agents who were in the same hex today, including
  // home in the evening, meet. Each sees what the others worked at there (passive, no cap),
  // sees any craft they practised there (and may learn it, ODD §7.3), then chats with up to k
  // of the people it met (ODD §4.6).
  meet(live) {
    const at = new Map();
    for (const a of live) {
      a.met = [];
      for (const h of a.places) {
        let list = at.get(h);
        if (!list) at.set(h, list = []);
        if (list[list.length - 1] !== a) list.push(a);
      }
    }
    for (const [h, list] of at) {
      if (list.length < 2) continue;
      for (const a of list) {
        for (const b of list) {
          if (b === a) continue;
          if (a.met.indexOf(b) < 0) a.met.push(b);
          for (const o of b.obs) if (o.hex === h) a.observe(o);
          if (b.practised.length) a.seePractice(this, b, h);   // know-how by seeing (ODD §7.3)
        }
      }
    }
    for (const a of live) { a.metTotal += a.met.length; a.chat(this); }
  }

  // Hours from `hex` to every hex within a day's waking hours, cached (terrain never changes).
  travel(hex) {
    let t = this.travelCache.get(hex);
    if (!t) { t = this.travelFrom(hex, PARAMETERS.agents.wakingHours); this.travelCache.set(hex, t); }
    return t;
  }

  // Remove up to `amount` of resource `res` from hex `i`; returns what was taken.
  take(res, i, amount) {
    const st = this.stock[res];
    const got = Math.min(amount, st[i]);
    st[i] -= got;
    return got;
  }

  // Total stock of a resource as a fraction of its total cap (for measures and charts).
  stockFraction(res) {
    const st = this.stock[res], cap = this.caps[res], act = this.active[res];
    let s = 0, c = 0;
    for (let j = 0; j < act.length; j++) { s += st[act[j]]; c += cap[act[j]]; }
    return c > 0 ? s / c : 0;
  }

  // ── travel ─────────────────────────────────────────────────────────────────────────────
  // Hours from hex `from` to every hex, by terrain-weighted shortest path (Dijkstra).
  // Crossing from a to b costs half of each hex's crossing time. Hexes beyond `maxHours`
  // (or unreachable) are Infinity.
  travelFrom(from, maxHours) {
    if (maxHours == null) maxHours = Infinity;
    const g = this.grid, h = this.hours;
    const dist = new Float32Array(g.n).fill(Infinity);
    if (h[from] < 0) return dist;
    dist[from] = 0;
    const heap = new MinHeap();
    heap.push(0, from);
    while (heap.size) {
      const i = heap.pop(), di = heap.lastKey;
      if (di > dist[i]) continue;
      for (let d = 0; d < 6; d++) {
        const m = g.nbr[i * 6 + d];
        if (m < 0 || h[m] < 0) continue;
        const nd = di + 0.5 * (h[i] + h[m]);
        if (nd < dist[m] && nd <= maxHours) { dist[m] = nd; heap.push(nd, m); }
      }
    }
    return dist;
  }

  // ── fixed maps ─────────────────────────────────────────────────────────────────────────
  // A plain-JSON copy of the map (terrain and caps, not stocks), for `new World({ map })`.
  exportMap() {
    const caps = {};
    for (const k in this.caps) caps[k] = Array.from(this.caps[k]);
    return {
      width: this.grid.W, height: this.grid.H,
      terrain: Array.from(this.terrain), spring: Array.from(this.spring),
      caps, centres: this.centres,
    };
  }
};
