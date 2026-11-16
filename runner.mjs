// Headless batch runner. Loads the SAME browser sim files into the MAIN V8 realm via indirect
// eval (exp.mjs loadSim; NOT vm — conventions §4: vm adds a ~7-10x hot-loop tax on per-tick
// global reads, and a one-config-per-process runner never needs vm's sandbox isolation).
// Saves every run under the experiment data protocol (conventions §4, exp.mjs, db.js v2):
//   node runner.mjs --register <slug> "<question>"     claim expNNN, print the EXPLOG stub
//   node runner.mjs --exp expNNN [--reps N] [--seed S] [--ticks N] [--name PREFIX] [--from C] [--save]
//   node runner.mjs --scratch [...]                     a check nothing will cite
// Each run goes to Mongo evoeco.expNNN_<slug> (the record) and results/expNNN_<slug>/<run>.json.
// --from starts each rep from a saved colony (ODD §5 Spin-up): a file, or expNNN/<run> for one an
// earlier experiment saved. --save keeps each rep's colony as results/expNNN_<slug>/<run>.colony.bin.
import { loadSim, openExperiment, flag, has, colonyPath, resolveColony, beat } from './exp.mjs';

const P = loadSim(['datamanager.js']);
const { saveColony, loadColony } = await import('./colony.mjs');
const { World, DataManager } = globalThis;
const { db, ex, dir } = await openExperiment('runner.mjs');

const reps = parseInt(flag('reps', '1'), 10);
const seed0 = parseInt(flag('seed', '1'), 10);
const prefix = flag('name', 'run');
const fromRef = flag('from', null), fromFile = fromRef && resolveColony(fromRef);
const limit = parseInt(flag('ticks', '0'), 10) || P.epoch;

for (let r = 0; r < reps; r++) {
  P.seed = seed0 + r;  // one map per rep; a saved colony brings its own seed and generator state
  const world = fromFile ? loadColony(fromFile) : new World();
  const name = prefix + '_s' + P.seed + (fromFile && reps > 1 ? '_r' + r : '');
  const run = ex.run(P, { name, seed: P.seed });  // after loadColony, which merges saved PARAMETERS
  await run.start();
  const dm = new DataManager(world, null, null);
  for (let t = 1; t <= limit; t++) {
    world.update();
    if (world.day % P.reportingPeriod === 0) dm.samples.push(dm.sample());
    beat(t, limit, ex.label + '/' + name);
  }
  if (has('save')) saveColony(world, colonyPath(dir, name));
  const res = await run.save(Object.assign({ samples: dm.samples }, fromRef ? { from: fromRef } : {}));
  console.log(ex.label + '/' + name + ': ' + dm.samples.length + ' samples, ' + (res.bytes / 1024).toFixed(1) + ' KB' + (has('save') ? ', colony saved' : ''));
}
await db.close();
