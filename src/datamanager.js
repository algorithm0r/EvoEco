'use strict';
// Samples the world every reportingPeriod days and ships a self-describing packet (full
// PARAMETERS + samples) to the DB at epoch. The packet() helper (db.js) embeds PARAMETERS
// verbatim so every run reconstructs from its own record.
//
// Stage 1 samples renewable and flow stocks as fractions of their caps; the wellbeing
// measures (ODD §4.10) arrive with agents.
//
// For the live view it also keeps `rec`: one plain array per measure (and one array of bin
// counts per distribution), grown by one entry each reporting period. ui.js hands these
// arrays to the charts once, by reference; nothing here touches the DOM.
//
// NOTE: in the browser this auto-flushes at epoch (fire-and-forget, errors logged). The
// headless runner (runner.mjs) drives days and flushes explicitly so it can await the write.
var DataManager = class DataManager {
  constructor(world, db) {
    this.world = world;
    this.db = db;
    this.samples = [];
    this.run = (PARAMETERS.db && PARAMETERS.db.run) || 'run';
    this.flushed = false;
    this.rec = {};
    for (const k of DataManager.SERIES) this.rec[k] = [];
    for (const k in DataManager.DISTS) this.rec[k] = [];
    // per-day events summed over the period (trades, gifts) and the running totals the
    // period's change is read from (grain, camp moves, deaths)
    this.acc = { trades: 0, gifts: 0, days: 0 };
    this.last = { sown: 0, reaped: 0, campMoves: 0, dead: 0 };
  }

  // Stage 2 adds the living agents' mean need levels and hours (the full percentile
  // measures of ODD §4.10 come with the foundation, Stage 7).
  sample() {
    const w = this.world, L = w.agents;
    const mean = (f) => L.length ? L.reduce((s, a) => s + f(a), 0) / L.length : null;
    return {
      day: w.day,
      plants: w.stockFraction('plants'), wood: w.stockFraction('wood'),
      soil: w.stockFraction('soil'), water: w.stockFraction('water'),
      alive: L.length, dead: w.dead.length,
      food: mean((a) => a.level('food')), waterNeed: mean((a) => a.level('water')),
      warmth: mean((a) => a.level('warmth')), rest: mean((a) => a.need.rest),
      busy: mean((a) => a.busy), heldFood: mean((a) => a.hold.food),
      belonging: mean((a) => a.need.belonging),
      trades: (w.tradesToday || []).length, gifts: w.giftsToday || 0,
      // Stage 5b: crafted levels and know-how (ODD §7.3)
      huts: L.filter((a) => a.shelter.hutDone).length, pots: L.filter((a) => a.hold.pot > 0).length,
      knowPot: L.filter((a) => a.knows.has('pot')).length, knowHut: L.filter((a) => a.knows.has('hut')).length,
      discoveries: w.discoveries.length, learnedBySeeing: w.learnedBySeeing.length,
      // Stage 5d: farming
      knowFarm: L.filter((a) => a.knows.has('farm')).length, fields: w.fields.length,
      sown: w.sown || 0, reaped: w.reaped || 0, returnedGrain: w.returnedGrain || 0,
      heldGrain: mean((a) => a.hold.grain), farmReturn: mean((a) => a.farmReturn),
    };
  }

  // the live view's arrays, one entry per reporting period. Means are null (a gap in the
  // line) once nobody is alive; flows are per day over the period just ended.
  record() {
    const w = this.world, L = w.agents, r = this.rec, d = Math.max(1, this.acc.days);
    const mean = (f, list) => (list = list || L).length ? list.reduce((s, a) => s + f(a), 0) / list.length : null;
    r.alive.push(L.length);
    r.died.push(w.dead.length - this.last.dead);
    for (const k of ['food', 'water', 'warmth']) r[k].push(mean((a) => a.level(k)));
    r.rest.push(mean((a) => a.need.rest));
    r.belonging.push(mean((a) => a.need.belonging));
    const camps = (w.camps || []).filter((c) => c.members.length);
    r.camps.push(camps.length);
    r.campMoves.push((w.campMoves || 0) - this.last.campMoves);
    let livedIn = 0, empty = 0, building = 0, leanTos = 0;
    for (const s of w.dwellings || []) {
      if (s.hut > 0 && s.hutDone) { if (s.sleepers.length) livedIn++; else empty++; }
      else if (s.hut > 0) building++;
      else if (s.leanTo > 0) leanTos++;
    }
    r.hutsLivedIn.push(livedIn); r.hutsEmpty.push(empty); r.hutsBuilding.push(building); r.leanTos.push(leanTos);
    r.trades.push(this.acc.trades / d);
    r.gifts.push(this.acc.gifts / d);
    r.sown.push(((w.sown || 0) - this.last.sown) / d);
    r.reaped.push(((w.reaped || 0) - this.last.reaped) / d);
    const planters = L.filter((a) => a.knows.has('farm'));
    r.planters.push(planters.length);
    r.fields.push(w.fields.length);
    r.farmReturn.push(mean((a) => a.farmReturn, planters));
    r.discoveries.push(w.discoveries.length);
    r.learnedBySeeing.push(w.learnedBySeeing.length);
    for (const k of ['pot', 'hut', 'farm']) r['know_' + k].push(L.filter((a) => a.knows.has(k)).length);
    for (const k in DataManager.DISTS) {
      const D = DataManager.DISTS[k], bins = new Array(D.bins).fill(0);
      for (const a of L) bins[clamp(Math.floor((D.get(a) - D.lo) / (D.hi - D.lo) * D.bins), 0, D.bins - 1)]++;
      r[k].push(bins);
    }
    this.acc = { trades: 0, gifts: 0, days: 0 };
    this.last = { sown: w.sown || 0, reaped: w.reaped || 0, campMoves: w.campMoves || 0, dead: w.dead.length };
  }

  update() {
    const w = this.world;
    this.acc.trades += (w.tradesToday || []).length;
    this.acc.gifts += w.giftsToday || 0;
    this.acc.days++;
    if (w.day % PARAMETERS.reportingPeriod === 0) {
      this.samples.push(this.sample());
      this.record();
    }
    if (!this.flushed && this.world.day >= PARAMETERS.epoch) {
      this.flushed = true;
      this.flush();
    }
  }

  async flush() {
    if (!this.db) return { ok: false };
    const pkt = this.db.packet(PARAMETERS, { run: this.run, samples: this.samples });
    try {
      const res = await this.db.insert(this.run, pkt);
      if (typeof console !== 'undefined') console.log('[data] saved', JSON.stringify(res));
      return res;
    } catch (e) {
      if (typeof console !== 'undefined') console.error('[data] save failed:', e.message);
      return { ok: false, error: e.message };
    }
  }

  draw() {}
};

// the per-period measures the live view charts (each an array in dm.rec)
DataManager.SERIES = ['alive', 'died', 'food', 'water', 'warmth', 'rest', 'belonging', 'camps', 'campMoves',
  'hutsLivedIn', 'hutsEmpty', 'hutsBuilding', 'leanTos', 'trades', 'gifts', 'sown', 'reaped', 'planters',
  'fields', 'farmReturn', 'discoveries', 'learnedBySeeing', 'know_pot', 'know_hut', 'know_farm'];
// the distributions across the living, binned each period: need levels run from -1 (the
// reserve spent, ODD §2 Needs) to 1; rest and belonging from 0 to 1
DataManager.DISTS = {
  dFood: { get: (a) => a.level('food'), lo: -1, hi: 1, bins: 20 },
  dWater: { get: (a) => a.level('water'), lo: -1, hi: 1, bins: 20 },
  dWarmth: { get: (a) => a.level('warmth'), lo: -1, hi: 1, bins: 20 },
  dRest: { get: (a) => a.need.rest, lo: 0, hi: 1, bins: 20 },
  dBelonging: { get: (a) => a.need.belonging, lo: 0, hi: 1, bins: 20 },
};
