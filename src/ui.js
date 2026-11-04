'use strict';
// ALL DOM lives here (and in index.html). The sim classes never touch the document, which
// is what lets the same files run headlessly. The page is Claude Basic's sim layer
// (vendor/claude-basic): the world, then the clock and the key to the map, then the
// controls; the charts beside it. Every report is a line, every distribution a heatmap.
var $ = (id) => document.getElementById(id);

// The controls come from PARAM_SCHEMA and write straight into PARAMETERS; the map layer is
// view state, not a model parameter, so it has its own strip and never reaches a packet.
var VIEW = { layer: 'terrain' };
function buildControls(onReset, onPause) {
  $('ver').textContent = CB.version.split(' ')[0];
  $('picker').appendChild(CB.theme.picker());
  CB.sim.controls($('controls'), PARAM_SCHEMA, PARAMETERS, {
    onReset: onReset,
    buttons: [
      { label: 'Pause', onClick: (e) => { e.target.textContent = onPause() ? 'Pause' : 'Run'; } },
      { label: 'Reset', primary: true, onClick: onReset },
    ],
  });
  const layers = ['terrain', 'plants', 'wood', 'soil', 'water'];
  CB.sim.controls($('view'), [{ key: 'layer', label: 'Map layer', options: layers }], VIEW, {
    onChange: (k, v) => { if (observer) observer.layer = v; showLegend(); },
  });
  // the clock's year: four seasons of equal length, in world.season()'s order
  const q = PARAMETERS.year.days / 4;
  const tones = [['spring', 'ok'], ['summer', 'gold'], ['autumn', 'warn'], ['winter', 'info']];
  $('clock').setAttribute('period', PARAMETERS.year.days);
  $('clock').setAttribute('bands', JSON.stringify(tones.map(([label, tone], k) => ({ from: k * q, to: (k + 1) * q, label, tone }))));
  showLegend();
}

// the key to the map, drawn in the observer's own colours
function showLegend() {
  const M = Observer.MARK, items = [];
  if (VIEW.layer === 'terrain') {
    TERRAIN.forEach((t, k) => items.push({ label: t, mark: 'swatch', color: Observer.COLORS[k] }));
    for (const d in Observer.DEPOSIT) items.push({ label: d, mark: 'dot', color: Observer.DEPOSIT[d] });
    items.push({ label: 'spring', mark: 'ring', color: M.spring });
  } else {
    items.push({ label: 'no ' + VIEW.layer, mark: 'swatch', color: Observer.ramp(VIEW.layer, 0) });
    items.push({ label: 'full', mark: 'swatch', color: Observer.ramp(VIEW.layer, 1) });
  }
  items.push(
    { label: 'needs met', mark: 'dot', color: hsl(120, 80, 55) },
    { label: 'in need', mark: 'dot', color: hsl(0, 80, 55) },
    { label: 'camp', mark: 'ring', color: M.camp },
    { label: 'hut', mark: 'square', color: M.hut },
    { label: 'hut being built', mark: 'dashed', color: M.hut },
    { label: 'empty hut', mark: 'square', color: M.emptyHut },
    { label: 'field', mark: 'swatch', color: M.growing },
    { label: 'ripe field', mark: 'swatch', color: M.ripe },
    { label: 'day\'s route', mark: 'line', color: M.route });
  $('legend').innerHTML = CB.render.simLegend(items);
}

// Hand each chart the datamanager's own arrays, once per reset (reset() makes new ones).
// The kit repaints a chart whenever one of its arrays grows; nothing here draws.
function wireCharts(dm) {
  const r = dm.rec, dx = PARAMETERS.reportingPeriod;
  const win = Math.round(PARAMETERS.epoch / dx);   // one run (epoch) in view, then it scrolls
  const line = (id, series) => {
    $(id).setAttribute('window', win);
    $(id).data = { dx, series: series.map(([label, key, color]) => ({ label, values: r[key], color })) };
  };
  line('pop', [['alive', 'alive'], ['died', 'died', 'var(--cb-bad)']]);
  line('needs', [['food', 'food'], ['water', 'water'], ['warmth', 'warmth'], ['rest', 'rest'], ['belonging', 'belonging']]);
  line('camps', [['camps', 'camps'], ['moves', 'campMoves']]);
  line('shelter', [['huts lived in', 'hutsLivedIn'], ['huts empty', 'hutsEmpty'], ['huts being built', 'hutsBuilding'], ['lean-tos', 'leanTos']]);
  line('exchange', [['trades', 'trades'], ['gifts', 'gifts']]);
  line('grain', [['sown', 'sown'], ['reaped', 'reaped']]);
  line('farmers', [['planters', 'planters'], ['fields', 'fields']]);
  line('farmReturn', [['grain back per seed', 'farmReturn']]);
  line('know', [['discoveries', 'discoveries'], ['learned by seeing', 'learnedBySeeing']]);
  line('knowers', [['pot', 'know_pot'], ['hut', 'know_hut'], ['farm', 'know_farm']]);
  for (const k in DataManager.DISTS) {
    $(k).setAttribute('window', win);
    $(k).data = { dx, columns: r[k] };
  }
}

// the canvas takes the hex map's own aspect (the Observer fits the map to the canvas), so
// no dead band sits between the world and the bar under it
function fitWorld(canvas, g) {
  const s = canvas.width / (Math.sqrt(3) * (g.W + 0.5));
  canvas.height = Math.ceil(s * (1.5 * (g.H - 1) + 2));
}

// time is the dial; called once per drawn frame
function showTime(day) { $('clock').value = day; }
