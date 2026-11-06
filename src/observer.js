'use strict';
// The view. Reads world state and draws it; never mutates the model. Keeping all rendering
// here is what makes the world headless-safe.
//
// Layers: 'terrain' shows the ground with deposits and springs marked, land under trees drawn
// as forest (Stage 5g: forest is cover, so clearing shows); a resource name ('greens',
// 'seeds', 'nuts', 'roots', 'wood', 'soil', 'water') shades each hex by amount / cap.
var Observer = class Observer {
  constructor(world) {
    this.world = world;
    this.layer = 'terrain';
  }

  update() {}

  draw(ctx) {
    const w = this.world, g = w.grid;
    const s = Math.min(ctx.canvas.width / (Math.sqrt(3) * (g.W + 0.5)), ctx.canvas.height / (1.5 * (g.H - 1) + 2));
    const shade = this.layer !== 'terrain' ? this.layer : null;
    for (let i = 0; i < g.n; i++) {
      const c = g.centre(i, s);
      let t = this.world.terrain[i];
      if (t === T_FOREST || t === T_PLAINS) t = w.cover.trees[i] > 0.5 ? T_FOREST : T_PLAINS;
      let fill = Observer.COLORS[t];
      if (shade) {
        const cap = w.caps[shade][i];
        fill = cap > 0 ? Observer.ramp(shade, w.amount(shade, i) / cap) : '#1a1e25';
      }
      Observer.hex(ctx, c.x, c.y, s, fill);
    }
    this.drawAgents(ctx, s);
    if (shade) return;
    // deposits (one dot per kind present, side by side) and springs
    const kinds = ['flint', 'clay', 'copper', 'tin', 'iron'];
    for (let i = 0; i < g.n; i++) {
      const c = g.centre(i, s);
      let k = 0;
      for (const name of kinds) {
        if (w.caps[name] && w.caps[name][i] > 0) {
          ctx.fillStyle = Observer.DEPOSIT[name];
          ctx.globalAlpha = 0.35 + 0.65 * (w.stock[name][i] / w.caps[name][i]);
          ctx.beginPath();
          ctx.arc(c.x - s * 0.3 + k * s * 0.3, c.y, s * 0.22, 0, TAU);
          ctx.fill();
          k++;
        }
      }
      ctx.globalAlpha = 1;
      if (w.spring[i]) {
        ctx.strokeStyle = Observer.MARK.spring;
        ctx.beginPath(); ctx.arc(c.x, c.y, s * 0.5, 0, TAU); ctx.stroke();
      }
    }
  }

  // today's routes as thin lines from home through each stop and back, and each home as a
  // dot coloured by the agent's most lacking need (green = all met, red = at or below 0)
  drawAgents(ctx, s) {
    const w = this.world, g = w.grid;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = Observer.MARK.route;
    for (const a of w.agents) {
      if (!a.plan.length) continue;
      const h = g.centre(a.home, s);
      ctx.beginPath();
      ctx.moveTo(h.x, h.y);
      for (const st of a.plan) { const c = g.centre(st.hex, s); ctx.lineTo(c.x, c.y); }
      ctx.lineTo(h.x, h.y);
      ctx.stroke();
    }
    // fields (Stage 5d): green while growing, gold once ripe
    for (const f of w.fields) {
      const c = g.centre(f.hex, s);
      ctx.fillStyle = f.ripe ? Observer.MARK.ripe : Observer.MARK.growing;
      ctx.fillRect(c.x - s * 0.35, c.y - s * 0.35, s * 0.7, s * 0.7);
    }
    // empty huts (ODD §5: things in the world, anyone may use one): a faint square
    ctx.save();
    ctx.strokeStyle = Observer.MARK.emptyHut;
    for (const d of w.dwellings || []) {
      if (d.sleepers.length || !(d.hut > 0)) continue;
      const c = g.centre(d.hex, s);
      if (!d.hutDone) ctx.setLineDash([2, 2]); else ctx.setLineDash([]);
      ctx.strokeRect(c.x - s * 0.8, c.y - s * 0.8, s * 1.6, s * 1.6);
    }
    ctx.restore();
    // camps (ODD §5 Moving camp): a ring at each camp's hex
    ctx.strokeStyle = Observer.MARK.camp;
    ctx.lineWidth = 2;
    for (const c of w.camps || []) {
      if (!c.members.length) continue;
      const p = g.centre(c.hex, s);
      ctx.beginPath(); ctx.arc(p.x, p.y, s * 1.6, 0, TAU); ctx.stroke();
    }
    ctx.lineWidth = 1;
    for (const a of w.agents) {
      const h = g.centre(a.home, s);
      const worst = Math.min(a.need.food, a.need.water, a.need.warmth, a.need.rest);
      ctx.fillStyle = hsl(120 * clamp(worst, 0, 1), 80, 55);
      ctx.strokeStyle = Observer.MARK.outline;
      ctx.beginPath(); ctx.arc(h.x, h.y, s * 0.55, 0, TAU); ctx.fill(); ctx.stroke();
      // a finished hut: a square around the home; one being built: a dashed square
      if (a.shelter.hut > 0) {
        ctx.save();
        ctx.strokeStyle = Observer.MARK.hut;
        if (!a.shelter.hutDone) ctx.setLineDash([2, 2]);
        ctx.strokeRect(h.x - s * 0.8, h.y - s * 0.8, s * 1.6, s * 1.6);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  static hex(ctx, x, y, s, fill) {
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = Math.PI / 180 * (60 * k - 30);
      const px = x + s * Math.cos(a), py = y + s * Math.sin(a);
      if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  // dark → full colour as the fraction goes 0 → 1
  static ramp(layer, f) {
    const hue = { greens: 95, seeds: 50, nuts: 25, roots: 15, wood: 130, soil: 35, water: 205 }[layer];
    return hsl(hue, 55, 10 + 45 * clamp(f, 0, 1));
  }
};
// indexed by terrain code (mapgen.js TERRAIN)
Observer.COLORS = ['#6f8f52', '#2f5a36', '#8a7656', '#3a7cc2', '#2a5d9a'];
Observer.DEPOSIT = { flint: '#d8d8d0', clay: '#c4703a', copper: '#e08a2c', tin: '#a9c9e8', iron: '#b0302a' };
// the world's other marks, named so the page's legend draws them in the same colours
Observer.MARK = {
  spring: '#bfe6ff', route: 'rgba(255,240,200,0.55)', growing: '#a7c957', ripe: '#e8c547',
  hut: '#f2e6c8', emptyHut: 'rgba(242,230,200,0.45)', outline: '#000', camp: '#ffd84d',
};
