'use strict';
// Hex grid geometry (ODD §2 Landscape: the map is a hex grid; a hex is about an hour's walk
// across). Pointy-top hexes stored in "odd-r" offset layout: cell index = row * W + col,
// odd rows shoved half a hex right. Distances and neighbours go through cube coordinates.
// Pure geometry: no model state, no DOM.
var HexGrid = class HexGrid {
  constructor(width, height) {
    this.W = width;
    this.H = height;
    this.n = width * height;
    // neighbour table: 6 slots per cell, -1 where the neighbour is off the map
    this.nbr = new Int32Array(this.n * 6).fill(-1);
    for (let i = 0; i < this.n; i++) {
      const col = i % width, row = (i / width) | 0;
      const offs = (row & 1) ? HexGrid.ODD : HexGrid.EVEN;
      for (let d = 0; d < 6; d++) {
        const c = col + offs[d][0], r = row + offs[d][1];
        if (c >= 0 && c < width && r >= 0 && r < height) this.nbr[i * 6 + d] = r * width + c;
      }
    }
  }

  col(i) { return i % this.W; }
  row(i) { return (i / this.W) | 0; }

  // hex steps between two cells (cube distance)
  dist(a, b) {
    const ar = this.row(a), br = this.row(b);
    const aq = this.col(a) - ((ar - (ar & 1)) >> 1);
    const bq = this.col(b) - ((br - (br & 1)) >> 1);
    const dq = aq - bq, dr = ar - br;
    return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
  }

  // all cells within `radius` hex steps of `centre` (including it)
  within(centre, radius) {
    const out = [centre];
    const seen = new Set(out);
    let frontier = out.slice();
    for (let k = 0; k < radius; k++) {
      const next = [];
      for (const c of frontier) {
        for (let d = 0; d < 6; d++) {
          const m = this.nbr[c * 6 + d];
          if (m >= 0 && !seen.has(m)) { seen.add(m); next.push(m); out.push(m); }
        }
      }
      frontier = next;
    }
    return out;
  }

  // centre of a cell in pixels for hex size `s` (centre-to-corner)
  centre(i, s) {
    const row = this.row(i);
    return { x: s * Math.sqrt(3) * (this.col(i) + 0.5 * (row & 1) + 0.5), y: s * (1.5 * row + 1) };
  }
};
// [dcol, drow] for the six neighbours, by row parity (odd-r layout)
HexGrid.EVEN = [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]];
HexGrid.ODD = [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]];
