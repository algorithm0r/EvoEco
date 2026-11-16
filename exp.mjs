// Experiment plumbing for EvoEco's headless runs (the experiment data protocol, conventions §4;
// db.js v2). runner.mjs and every probe script use it, so each run lands in Mongo as part of a
// numbered experiment (the record) with a JSON copy in results/, and nothing cited lives in a
// session scratchpad. A script that imports it takes these flags:
//   --register <slug> "<question>"   claim the next expNNN, print the EXPLOG stub, exit
//   --exp expNNN                     run into that experiment; refuses until EXPLOG.md has
//                                    a "## expNNN" heading (pre-registration)
//   --scratch                        a check that nothing will cite: evoeco_scratch in Mongo,
//                                    results/_scratch/ on disk
// Typical probe:
//   import { loadSim, openExperiment, flag, beat } from '<sim>/exp.mjs';
//   const P = loadSim();
//   const { db, ex } = await openExperiment('carryprobe.mjs');
//   const run = ex.run(P, { name: 'limit_s' + seed, seed });   // before the World is made
//   await run.start();  ...simulate, collecting rows...  await run.save({ seasons });
//   await db.close();
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

export const SIM = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { createDB } = require('./src/db.js');

// The DOM-free sim core in load order (index.html's order, without the view files). A new src/
// file the headless runs need is added here, once.
export const CORE = ['util.js', 'params.js', 'engine.js', 'hex.js', 'mapgen.js', 'agent.js', 'tree.js',
  'planner.js', 'exchange.js', 'life.js', 'game.js', 'world.js'];

// Load the core (plus any extra src/ files) into the main V8 realm by indirect eval (not vm,
// conventions §4): with 'use strict' stripped, top-level var/function attach to globalThis.
export function loadSim(extra = []) {
  const indirectEval = eval;
  for (const f of CORE.concat(extra))
    indirectEval(readFileSync(path.join(SIM, 'src', f), 'utf8').replace(/^\s*(['"])use strict\1;?/, ''));
  return globalThis.PARAMETERS;
}

export const argv = process.argv.slice(2);
export const has = (n) => argv.includes('--' + n);
export const flag = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : d; };
const die = (m) => { console.error(m); process.exit(2); };

// Open the experiment the command line names. Call after loadSim(). Returns { db, ex, dir }:
// dir is the experiment's results folder (its JSON copies, and any colonies its runs save).
export async function openExperiment(script) {
  const P = globalThis.PARAMETERS;
  const scratch = has('scratch');
  const root = path.join(SIM, 'results', scratch ? '_scratch' : '');
  const base = createDB(Object.assign({}, P.db, {
    transport: 'direct', db: flag('db', P.db.db), project: 'EvoEco', repo: SIM, results: root }));
  const db = scratch ? base.scratch() : base;

  if (has('register')) {
    const i = argv.indexOf('--register'), slug = argv[i + 1], question = argv[i + 2];
    if (!slug || !question) die('usage: node ' + script + ' --register <slug> "<one-line question>"');
    const ex = await db.experiment(slug, { question });
    console.log(ex.label + ' registered as ' + db.dbName + '.' + ex.collection + '\n\nAdd to EXPLOG.md (newest on top) before running:\n');
    console.log('## ' + ex.label + ' — ' + question + '\n**Pre-registered:** ' + new Date().toISOString().slice(0, 10) +
      '\n**Script:** ' + script + '\n**Settings:** (parameters that differ from defaults; colony it starts from)' +
      '\n**Seeds / reps / length:**\n**Measures:**\n');
    await db.close();
    process.exit(0);
  }

  let ex;
  if (scratch) ex = await db.experiment(flag('slug', 'scratch'), { question: 'scratch run of ' + script });
  else {
    const label = flag('exp', null);
    if (!label || !/^exp\d{3,}$/.test(label))
      die('Need --exp expNNN (register first: node ' + script + ' --register <slug> "<question>"), or --scratch for a check nothing will cite.');
    const log = path.join(SIM, 'EXPLOG.md');
    if (!new RegExp('^##\\s+' + label + '\\b', 'm').test(existsSync(log) ? readFileSync(log, 'utf8') : ''))
      die('EXPLOG.md has no "## ' + label + '" entry. Pre-register the experiment before running it (conventions §4).');
    ex = await db.experiment(label);
  }
  return { db, ex, dir: path.join(root, ex.collection) };
}

// A saved colony belongs to the run that made it: <experiment folder>/<run>.colony.bin.
export const colonyPath = (dir, runName) => path.join(dir, runName + '.colony.bin');

// --from takes a file path, or "expNNN/<run>" for a colony an earlier experiment saved.
export function resolveColony(ref) {
  const m = /^(exp\d{3,})\/(.+)$/.exec(ref);
  if (!m) return ref;
  const root = path.join(SIM, 'results');
  const folder = existsSync(root) && readdirSync(root).find((d) => d.startsWith(m[1] + '_'));
  const file = folder && path.join(root, folder, m[2] + '.colony.bin');
  if (!file || !existsSync(file)) die('no saved colony ' + ref + ' (looked for results/' + m[1] + '_*/' + m[2] + '.colony.bin)');
  return file;
}

// Progress for the cpuslot dashboard (conventions §4a″), at most every 30 s.
let lastBeat = 0;
export function beat(done, total, note) {
  const f = process.env.CPUSLOT_HEARTBEAT;
  if (!f || Date.now() - lastBeat < 30000) return;
  lastBeat = Date.now();
  try { writeFileSync(f, JSON.stringify({ done, total, note })); } catch (e) {}
}
