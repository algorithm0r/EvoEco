'use strict';
// Pure helpers — no DOM, no globals beyond these. Safe to load in the browser AND headless
// (declared as `var`/`function` so they attach to either global).
var TAU = Math.PI * 2;

function clamp(x, lo, hi) { return x < lo ? lo : (x > hi ? hi : x); }

// Seeded PRNG (mulberry32). The model never calls Math.random: every draw comes from a
// generator made from PARAMETERS.seed, so the same seed reproduces the same run.
function makeRng(seed) {
  let a = seed >>> 0;
  const rng = function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.int = function (n) { return Math.floor(rng() * n); };
  rng.pick = function (arr) { return arr[Math.floor(rng() * arr.length)]; };
  return rng;
}

// Min-heap of (key, value) pairs on parallel arrays; used by Dijkstra (travel times).
var MinHeap = class MinHeap {
  constructor() { this.keys = []; this.vals = []; }
  get size() { return this.keys.length; }
  push(key, val) {
    const k = this.keys, v = this.vals;
    let i = k.length;
    k.push(key); v.push(val);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (k[p] <= key) break;
      k[i] = k[p]; v[i] = v[p]; i = p;
    }
    k[i] = key; v[i] = val;
  }
  // returns the value with the smallest key; the key is left in this.lastKey
  pop() {
    const k = this.keys, v = this.vals;
    const topV = v[0];
    this.lastKey = k[0];
    const lastK = k.pop(), lastV = v.pop();
    const n = k.length;
    if (n > 0) {
      let i = 0;
      for (;;) {
        let c = 2 * i + 1;
        if (c >= n) break;
        if (c + 1 < n && k[c + 1] < k[c]) c++;
        if (k[c] >= lastK) break;
        k[i] = k[c]; v[i] = v[c]; i = c;
      }
      k[i] = lastK; v[i] = lastV;
    }
    return topV;
  }
};

function rgb(r, g, b) { return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')'; }
function hsl(h, s, l) { return 'hsl(' + (h | 0) + ',' + (s | 0) + '%,' + (l | 0) + '%)'; }
