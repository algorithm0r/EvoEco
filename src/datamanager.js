'use strict';
// Samples the world every reportingPeriod days, feeds the live graph, and ships a
// self-describing packet (full PARAMETERS + samples) to the DB at epoch. The packet()
// helper (db.js) embeds PARAMETERS verbatim so every run reconstructs from its own record.
//
// Stage 1 samples renewable and flow stocks as fractions of their caps; the wellbeing
// measures (ODD §4.10) arrive with agents.
//
// NOTE: in the browser this auto-flushes at epoch (fire-and-forget, errors logged). The
// headless runner (runner.mjs) drives days and flushes explicitly so it can await the write.
var DataManager = class DataManager {
  constructor(world, db, graph) {
    this.world = world;
    this.db = db;
    this.graph = graph;
    this.samples = [];
    this.run = (PARAMETERS.db && PARAMETERS.db.run) || 'run';
    this.flushed = false;
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
      food: mean((a) => a.need.food), waterNeed: mean((a) => a.need.water),
      warmth: mean((a) => a.need.warmth), rest: mean((a) => a.need.rest),
      busy: mean((a) => a.busy), heldFood: mean((a) => a.hold.food),
    };
  }

  update() {
    if (this.world.day % PARAMETERS.reportingPeriod === 0) {
      const s = this.sample();
      this.samples.push(s);
      if (this.graph) this.graph.push(s.food == null ? 0 : clamp(s.food, 0, 1));
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
