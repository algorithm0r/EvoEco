'use strict';
// Browser entry + wiring (not loaded headlessly). reset() rebuilds the world from the
// current PARAMETERS; the boot sequence is straight — no AssetManager gate.
var gameEngine, world, observer, dataManager, db;

function reset() {
  gameEngine.clear();
  world = new World();
  observer = new Observer(world);
  const graph = new LineGraph(10, 10, 200, 80, 'water (fraction of cap)');
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
  setStatus('year ' + (Math.floor(world.day / Y) + 1) + ', day ' + (world.day % Y + 1) + ' — ' + sea.name +
    ' | plants ' + world.stockFraction('plants').toFixed(2) + ', water ' + world.stockFraction('water').toFixed(2));
}

window.onload = function () {
  const canvas = document.getElementById('gameWorld');
  gameEngine = new GameEngine();
  gameEngine.init(canvas.getContext('2d'));
  buildControls();
  reset();
  gameEngine.start();
};
