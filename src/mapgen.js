'use strict';
// Map generation from parameters + seed (ODD §2: maps are generated; some experiments fix
// one). Produces terrain and the cap of every resource per hex. Everything random comes
// from the rng passed in, so one seed gives one map.
//
// Order: elevation and moisture noise → terrain by quantile (lake, hills, forest, plains) →
// rivers traced downhill from springs in the hills → resource caps by terrain, floodplain,
// riverbank and clustered deposits.

var TERRAIN = ['plains', 'forest', 'hills', 'river', 'lake'];
var T_PLAINS = 0, T_FOREST = 1, T_HILLS = 2, T_RIVER = 3, T_LAKE = 4;

// Smooth value noise on a random lattice; fbm sums `octaves` of it.
function makeNoise(rng, w, h) {
  const v = new Float32Array(w * h);
  for (let i = 0; i < v.length; i++) v[i] = rng();
  const s = (t) => t * t * (3 - 2 * t);
  return function (x, y) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = s(x - x0), fy = s(y - y0);
    const i = y0 * w + x0;
    const a = v[i], b = v[i + 1], c = v[i + w], d = v[i + w + 1];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}

function makeFbm(rng, grid, scale, octaves) {
  const layers = [];
  let freq = scale;
  for (let o = 0; o < octaves; o++) {
    const w = Math.ceil(Math.sqrt(3) * (grid.W + 1) * freq) + 2;
    const h = Math.ceil((1.5 * grid.H + 1) * freq) + 2;
    layers.push({ f: freq, n: makeNoise(rng, w, h) });
    freq *= 2;
  }
  return function (i) {
    const c = grid.centre(i, 1);
    let sum = 0, amp = 1, norm = 0;
    for (const L of layers) { sum += amp * L.n(c.x * L.f, c.y * L.f); norm += amp; amp *= 0.5; }
    return sum / norm;
  };
}

// value at quantile q of a typed array
function quantile(arr, q) {
  const s = Float32Array.from(arr).sort();
  return s[clamp(Math.floor(q * s.length), 0, s.length - 1)];
}

function generateMap(grid, P, rng) {
  const M = P.map, n = grid.n;
  const elevFn = makeFbm(rng, grid, M.noiseScale, M.octaves);
  const moistFn = makeFbm(rng, grid, M.noiseScale, M.octaves);
  const elev = new Float32Array(n), moist = new Float32Array(n);
  for (let i = 0; i < n; i++) { elev[i] = elevFn(i); moist[i] = moistFn(i); }

  // terrain by quantile, so the fractions hold whatever the noise draws
  const terrain = new Uint8Array(n);
  const lakeT = quantile(elev, M.lakeFrac), hillT = quantile(elev, 1 - M.hillFrac);
  const landMoist = [];
  for (let i = 0; i < n; i++) {
    if (elev[i] <= lakeT) terrain[i] = T_LAKE;
    else if (elev[i] >= hillT) terrain[i] = T_HILLS;
    else { terrain[i] = T_PLAINS; landMoist.push(moist[i]); }
  }
  const forestT = quantile(Float32Array.from(landMoist), 1 - M.forestFrac);
  for (let i = 0; i < n; i++) if (terrain[i] === T_PLAINS && moist[i] >= forestT) terrain[i] = T_FOREST;

  // rivers: springs at the highest hill cells, spaced apart; each runs to the lowest
  // unvisited neighbour until it reaches a lake, another river or the map edge
  const spring = new Uint8Array(n);
  const hills = [];
  // springs keep 2 hexes from the edge, or a river can run straight off the map
  const inland = (i) => { const c = grid.col(i), r = grid.row(i); return c >= 2 && r >= 2 && c < grid.W - 2 && r < grid.H - 2; };
  for (let i = 0; i < n; i++) if (terrain[i] === T_HILLS && inland(i)) hills.push(i);
  hills.sort((a, b) => elev[b] - elev[a]);
  const sources = [];
  for (const h of hills) {
    if (sources.length >= M.nRivers) break;
    if (sources.every((s) => grid.dist(s, h) >= M.riverSpacing)) sources.push(h);
  }
  for (const src of sources) {
    spring[src] = 1;
    let cur = src;
    const visited = new Set([cur]);
    for (let step = 0; step < grid.n; step++) {
      terrain[cur] = T_RIVER;
      let best = -1, edge = false;
      for (let d = 0; d < 6; d++) {
        const m = grid.nbr[cur * 6 + d];
        if (m < 0) { edge = true; continue; }
        if (visited.has(m)) continue;
        if (best < 0 || elev[m] < elev[best]) best = m;
      }
      if (edge || best < 0) break;
      if (terrain[best] === T_LAKE || terrain[best] === T_RIVER) break;
      visited.add(best);
      cur = best;
    }
  }

  // resource caps
  const caps = {};
  const isWater = (i) => terrain[i] === T_RIVER || terrain[i] === T_LAKE;
  const nearWater = (i, range) => grid.within(i, range).some(isWater);
  const centres = {};
  for (const name in P.resources) {
    const R = P.resources[name];
    const cap = new Float32Array(n);
    if (R.capBy) {
      for (let i = 0; i < n; i++) cap[i] = R.capBy[TERRAIN[terrain[i]]] || 0;
    }
    if (R.floodplainBonus) {
      for (let i = 0; i < n; i++) if (cap[i] > 0 && !isWater(i) && nearWater(i, R.floodplainRange)) cap[i] *= R.floodplainBonus;
    }
    if (R.spring) for (let i = 0; i < n; i++) if (spring[i]) cap[i] += R.spring;
    if (R.bankFrac) {
      for (let i = 0; i < n; i++) if (!isWater(i) && nearWater(i, 1) && rng() < R.bankFrac) cap[i] = R.deposit;
    }
    if (R.clusters) centres[name] = placeClusters(grid, terrain, R, cap, rng, centres.copper);
    caps[name] = cap;
  }
  return { terrain, elev, spring, caps, centres };
}

// Deposits in clusters on the listed terrains. With distanceFromCopper set, each cluster
// centre is the candidate whose distance to the NEAREST copper centre is closest to that
// value (far from all the copper, not just one cluster of it).
function placeClusters(grid, terrain, R, cap, rng, copperCentres) {
  const ok = (i) => R.on.indexOf(TERRAIN[terrain[i]]) >= 0;
  let cand = [];
  for (let i = 0; i < grid.n; i++) if (ok(i)) cand.push(i);
  if (!cand.length) for (let i = 0; i < grid.n; i++) if (terrain[i] !== T_LAKE && terrain[i] !== T_RIVER) cand.push(i);
  const out = [];
  for (let k = 0; k < R.clusters; k++) {
    let c;
    if (R.distanceFromCopper && copperCentres && copperCentres.length) {
      let bestErr = Infinity, ties = [];
      for (const i of cand) {
        let near = Infinity;
        for (const cu of copperCentres) near = Math.min(near, grid.dist(cu, i));
        const err = Math.abs(near - R.distanceFromCopper);
        if (err < bestErr - 1e-9) { bestErr = err; ties = [i]; } else if (Math.abs(err - bestErr) < 1e-9) ties.push(i);
      }
      c = rng.pick(ties);
    } else {
      c = rng.pick(cand);
    }
    out.push(c);
    for (const i of grid.within(c, R.radius)) {
      if (terrain[i] === T_LAKE || terrain[i] === T_RIVER) continue;
      if (i === c || rng() < R.fill) cap[i] = R.deposit;
    }
  }
  return out;
}
