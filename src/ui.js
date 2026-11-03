'use strict';
// ALL DOM lives here (and in index.html). The sim classes never touch the document, which
// is what lets the same files run headlessly. Builds the control panel from PARAM_SCHEMA
// and writes changes straight back into PARAMETERS.
function buildControls() {
  const panel = document.getElementById('controlPanel');
  for (const spec of PARAM_SCHEMA) {
    const wrap = document.createElement('label');
    wrap.className = 'ctl';
    wrap.appendChild(document.createTextNode(spec.label + ' '));
    const input = document.createElement('input');
    input.type = 'range';
    input.min = spec.min; input.max = spec.max; input.step = spec.step;
    // keys may be dotted paths into PARAMETERS ('agents.n')
    const path = spec.key.split('.'), last = path.pop();
    const obj = path.reduce((o, k) => o[k], PARAMETERS);
    input.value = obj[last];
    const val = document.createElement('span');
    val.textContent = ' ' + obj[last];
    input.oninput = function () {
      obj[last] = parseFloat(input.value);
      val.textContent = ' ' + input.value;
      if (spec.resets && typeof reset === 'function') reset();
    };
    wrap.appendChild(input);
    wrap.appendChild(val);
    panel.appendChild(wrap);
  }

  // map layer picker (view state, not a model parameter)
  const wrap = document.createElement('label');
  wrap.className = 'ctl';
  wrap.appendChild(document.createTextNode('Layer '));
  const sel = document.createElement('select');
  for (const name of ['terrain', 'plants', 'wood', 'soil', 'water']) {
    const o = document.createElement('option');
    o.value = o.textContent = name;
    sel.appendChild(o);
  }
  sel.onchange = function () { if (typeof observer !== 'undefined' && observer) observer.layer = sel.value; };
  wrap.appendChild(sel);
  panel.appendChild(wrap);

  const legend = document.createElement('div');
  legend.className = 'ctl';
  legend.innerHTML = 'Terrain: plains, forest, hills, river, lake.<br>Dots: flint (white), clay (brown), ' +
    'copper (orange), tin (pale blue), iron (red). Ring: spring.';
  panel.appendChild(legend);
}

function setStatus(msg) {
  const s = document.getElementById('status');
  if (s) s.textContent = msg;
}
