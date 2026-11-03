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
    const nAgents = opts.agents != null ? opts.agents : PARAMETERS.agents.n;
    this.placeAgents(nAgents);
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
      growth: Math.max(0, s),
      rain: 1 + Y.rainAmplitude * c,
      cold: Math.max(0, -s),
    };
  }

  // ── one day ────────────────────────────────────────────────────────────────────────────
  update() {
    this.day++;
    const sea = this.season();
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
    // 3. Exchange: none before Stage 5
    for (const a of live) a.consume(this);                            // 4. Consume
    for (const a of live) a.learn();                                  // 5. Learn
    for (const a of live) a.age(this);                                // 6. Aging and deaths
    for (const a of live) if (!a.alive) { a.deathDay = this.day; this.dead.push(a); }
    this.agents = live.filter((a) => a.alive);
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
