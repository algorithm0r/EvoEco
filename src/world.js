'use strict';
// The world holds all state and advances it one day per update (ODD §2 Scales: one tick =
// one day). Stage 1: the landscape only — hex map, resources, seasons, travel times. It is
// an engine entity (has update) but draws nothing: rendering is the Observer's job.
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
    this.learnedBySeeing = [];
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
    for (let b = 0; b < this.bandCentres.length; b++) {
      const homes = g.within(this.bandCentres[b], B.radius).filter((h) => this.hours[h] >= 0 && this.terrain[h] !== T_RIVER);
      for (let k = 0; k < B.size; k++) {
        const a = new Agent(this.agents.length, homes[this.rng.int(homes.length)], this);
        a.band = b;
        this.agents.push(a);
      }
    }
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
    if (this.agents.length) this.agentDay();
  }

  // The agents' day in synchronized phases (ODD §3): every agent finishes a phase before
  // any starts the next. Travel and work run in a random order reshuffled daily, which is
  // the order contested hexes are drawn from.
  agentDay() {
    const live = this.agents;
    for (const a of live) a.plan = planDay(a, this);                 // 1. Plan
    const order = live.slice();
    for (let i = order.length - 1; i > 0; i--) {                       // 2. Travel and work
      const j = this.rng.int(i + 1);
      const t = order[i]; order[i] = order[j]; order[j] = t;
    }
    for (const a of order) a.act(this);
    this.meet(live);                                                   //    meeting and chat
    this.giftsToday = 0;
    exchangeDay(this, live);                                          // 3. Exchange
    for (const a of live) a.consume(this);                            // 4. Consume
    for (const a of live) a.learn();                                  // 5. Learn
    for (const a of live) a.age(this);                                // 6. Aging and deaths
    for (const a of live) if (!a.alive) { a.deathDay = this.day; this.dead.push(a); }
    this.agents = live.filter((a) => a.alive);
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
