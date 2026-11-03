'use strict';
// The view. Reads world state and draws it; never mutates the model. Keeping all rendering
// here is what makes the world headless-safe.
//
// Layers: 'terrain' shows terrain with deposits and springs marked; a resource name
// ('plants', 'wood', 'soil', 'water') shades each hex by stock / cap.
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
      let fill = Observer.COLORS[this.world.terrain[i]];
      if (shade) {
        const cap = w.caps[shade][i];
        fill = cap > 0 ? Observer.ramp(shade, w.stock[shade][i] / cap) : '#1a1e25';
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
        ctx.strokeStyle = '#bfe6ff';
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
    ctx.strokeStyle = 'rgba(255,240,200,0.55)';
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
      ctx.fillStyle = f.ripe ? '#e8c547' : '#a7c957';
      ctx.fillRect(c.x - s * 0.35, c.y - s * 0.35, s * 0.7, s * 0.7);
    }
    for (const a of w.agents) {
      const h = g.centre(a.home, s);
      const worst = Math.min(a.need.food, a.need.water, a.need.warmth, a.need.rest);
      ctx.fillStyle = hsl(120 * clamp(worst, 0, 1), 80, 55);
      ctx.strokeStyle = '#000';
      ctx.beginPath(); ctx.arc(h.x, h.y, s * 0.55, 0, TAU); ctx.fill(); ctx.stroke();
      // a finished hut: a square around the home; one being built: a dashed square
      if (a.shelter.hut > 0) {
        ctx.save();
        ctx.strokeStyle = '#f2e6c8';
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
    const hue = { plants: 95, wood: 130, soil: 35, water: 205 }[layer];
    return hsl(hue, 55, 10 + 45 * clamp(f, 0, 1));
  }
};
// indexed by terrain code (mapgen.js TERRAIN)
Observer.COLORS = ['#6f8f52', '#2f5a36', '#8a7656', '#3a7cc2', '#2a5d9a'];
Observer.DEPOSIT = { flint: '#d8d8d0', clay: '#c4703a', copper: '#e08a2c', tin: '#a9c9e8', iron: '#b0302a' };
