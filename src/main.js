'use strict';
// Browser entry + wiring (not loaded headlessly). reset() rebuilds the world from the
// current PARAMETERS; the boot sequence is straight — no AssetManager gate.
var gameEngine, world, observer, dataManager, db;

function reset() {
  gameEngine.clear();
  world = new World();
  observer = new Observer(world);
  const graph = new LineGraph(10, 10, 200, 80, 'mean food level of the living');
  db = createDB(PARAMETERS.db);
  dataManager = new DataManager(world, db, graph);
  gameEngine.add(world);
  gameEngine.add(observer);
  gameEngine.add(dataManager);
  gameEngine.add(graph);
  gameEngine.add({ update: showStatus });
  showStatus();
}

function showStatus() {
  const sea = world.season();
  const Y = PARAMETERS.year.days;
  const L = world.agents;
  const mean = (f) => L.length ? (L.reduce((s, a) => s + f(a), 0) / L.length).toFixed(2) : '–';
  setStatus('year ' + (Math.floor(world.day / Y) + 1) + ', day ' + (world.day % Y + 1) + ' — ' + sea.name +
    ' | alive ' + L.length + ', dead ' + world.dead.length +
    ' | food ' + mean((a) => a.need.food) + ', warmth ' + mean((a) => a.need.warmth) +
    ', rest ' + mean((a) => a.need.rest) + ', hours ' + mean((a) => a.busy));
}

window.onload = function () {
  const canvas = document.getElementById('gameWorld');
  gameEngine = new GameEngine();
  gameEngine.init(canvas.getContext('2d'));
  buildControls();
  reset();
  gameEngine.start();
};
