'use strict';
// Browser entry + wiring (not loaded headlessly). reset() rebuilds the world from the
// current PARAMETERS and hands the new datamanager's arrays to the charts (ui.js); the
// boot sequence is straight — no AssetManager gate.
var gameEngine, world, observer, dataManager, db;

function reset() {
  gameEngine.clear();
  world = new World();
  observer = new Observer(world);
  observer.layer = VIEW.layer;
  fitWorld(gameEngine.ctx.canvas, world.grid);
  db = createDB(PARAMETERS.db);
  dataManager = new DataManager(world, db);
  gameEngine.add(world);
  gameEngine.add(observer);
  gameEngine.add(dataManager);
  gameEngine.add({ draw: () => showTime(world.day) });
  wireCharts(dataManager);
  gameEngine.draw();
}

// Pause / Run; returns whether the sim is now running
function togglePause() {
  if (gameEngine.running) gameEngine.stop(); else gameEngine.start();
  return gameEngine.running;
}

window.onload = function () {
  const canvas = document.getElementById('gameWorld');
  gameEngine = new GameEngine();
  gameEngine.init(canvas.getContext('2d'));
  buildControls(reset, togglePause);
  reset();
  gameEngine.start();
};
