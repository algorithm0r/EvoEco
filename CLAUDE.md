# EvoEco — Claude instructions

## Read first, every session
1. `STATUS.md` — where the system is right now (the 60-second orient)
2. `DEVLOG.md` — the top entry (what changed last)
3. `DEVPLAN.md` — the current `[ ACTIVE ]` stage
4. `ODD.md` — the model description, the sections the active stage builds. It is the spec:
   code implements the ODD, never the other way round.

## What this is
EvoEco ("evolution of economy"): an agent-based model of a pre-capital foundation economy
(reciprocity among tied agents, barter between strangers, on a hex landscape with homeostatic
agents) to which social technologies are added one at a time, from currency to corporate
capital, each judged by its effect on individual wellbeing (goods quality, rest, belonging).
Chris's claim to test: capital extraction turns an abundant economy into a scarce one whatever
the scale of output. A minimal existence proof.

## Model rules (never violate)
- **The ODD is the bible.** Every rule in code traces to an ODD entry (cite the section in a
  comment). A rule the ODD lacks is a design question for Chris, asked in plain chat text, one
  at a time, and recorded in ODD.md before it is coded. **Decided** = Chris's call; **Default**
  = Claude's proposal he didn't object to; **Open** = undiscussed.
- **The emergent-vs-imposed ledger (ODD §4.2).** Nothing the results are about may be written
  into a rule: no prebuilt ties, households, prices, specialization or inequality. Every stage
  ends with a ledger check of the rules it added.
- **Numbers are balanced as we go** (Chris, 2026-11-02): hours, yields, decay, wear and rates
  are `PARAMETERS`, set while building against what the model does, and logged when changed.
- **Never balance for a solitary agent** (Chris, 2026-11-02: "humans are not solitary").
  Tuning a world until a loner thrives leaves the economy nothing to do. Balance against the
  foundation forming (ODD §1); a stage without exchange tests mechanics, not survival.

## Stack (never violate)
- Vanilla JS + Canvas. No build step, no framework, no modules. `<script>` tags load
  `src/` in dependency order (`main.js` last).
- **Shared things are top-level `var`** — including `var Foo = class Foo {}`. This is what
  lets the SAME `src/` files run in the browser AND headless: the runners strip `'use strict'`
  and load them into the **main V8 realm via indirect `eval`** (not `vm`), where top-level
  `var` attaches to `globalThis` (a bare `class`/`const` would be block-scoped and never
  attach). Main-realm, not `vm`, because `vm` adds a ~7-10x hot-loop tax on per-tick global
  reads and we never need its sandbox isolation (conventions §4). Never fork the sim core.
- **All DOM lives in `ui.js` + `index.html`.** Sim classes (`world`, `agent`, `observer`,
  `datamanager`) touch zero DOM — that's what keeps them headless-safe.
- **Model/view split:** the world holds state and never draws; the `Observer` renders it.
- **Config:** one `PARAMETERS` global (`params.js`), serialized verbatim into every saved
  packet. `PARAM_SCHEMA` drives the control panel.
- **DB:** the vendored standard client `src/db.js` v2 (see `~/.claude/conventions.md` §4). The
  `mongodb` driver is in `package.json`; `npm install` in `sim/` if `node_modules/` is missing.

## Experiment data (Chris, 2026-11-13: "start using the protocol from now on")
Every headless run follows the experiment data protocol (conventions §4). `exp.mjs` is the
plumbing; `runner.mjs` and every probe script import it.
- **Probes are experiments.** Any run whose numbers might be cited (DEVLOG, STATUS, a question to
  Chris) is a numbered experiment: `--register <slug> "<question>"`, pre-register it in
  `EXPLOG.md`, then run with `--exp expNNN`. The run saves its data with `run.save({...})` (Mongo
  `evoeco.expNNN_<slug>` plus `results/expNNN_<slug>/<run>.json`). Runs that are only checks, and
  that nothing will cite, use `--scratch`.
- **No experiment output in a session scratchpad**: no stdout redirected to text files there, no
  colonies saved there. Probe *scripts* may be drafted in a scratchpad, but a script that
  produced a cited result is copied into `sim/probes/` so the result can be regenerated.
- **Colonies belong to the run that saved them:** `results/expNNN_<slug>/<run>.colony.bin`
  (runner `--save`; `colonyPath(dir, name)` in a probe). Start from one with `--from expNNN/<run>`.
- **Run names** include the seed: `<arm>_s<seed>` (e.g. `limit_s3`), plus `_r<rep>` when reps
  start from one colony.
- **Keep packets small** (Chris): diagnostics are named switches in PARAMETERS, off when unused;
  sample at larger gaps in longer runs. One run is one Mongo document, warned above 4 MB.
- Output from before 2026-11-13 is archived, unregistered, in `../analysis/archive/`.
- **Identity:** `index.html` `<title>` is `EvoEco` (conventions §6). Never a generic title.

## Conventions
Follow `~/.claude/conventions.md`. STATUS is overwritten every close (present truth); DEVLOG is
append-only, newest on top (history); DEVPLAN stages carry `[ DONE ] / [ ACTIVE ] / [ PLANNED ]`
tokens and a `**Done when:**` criterion. `/log-session` rewrites STATUS — don't hand-edit its
`Verified:` line (that moves only on a cold `/audit`).
- **Versions (Chris, 2026-11-03):** each closed stage gets an annotated tag on its commit,
  `v0.N.0`, numbered in order (v0.1.0 Stage 1 … v0.7.0 Stage 5b-cal, v0.8.0 Stage 5d; the next
  closed stage is v0.9.0). The ODD keeps its own design version (v0.3 …); the two are separate
  numbers.

## Run
- Browser: http://localhost:8000/research/EvoEco/sim/ (the always-on Static Server,
  conventions §4a′). Never start a server to view it; opening `index.html` from disk in the
  preview pane loads it without scripts.
- Headless batch: `node runner.mjs --exp expNNN --reps N` (see Experiment data above; writes to
  MongoDB directly through the Mint Tunnel at 127.0.0.1:27017).
- Smoke (no DB): `node smoketest.mjs` — prints the numbers that go in the DEVLOG entry.
- Every node run goes through the CPU coordinator (conventions §4a″):
  `cpuslot run --tag evoeco --desc "EvoEco <what>" -- node ...`, and long scripts write
  `{done,total,note}` to `CPUSLOT_HEARTBEAT` at most every 30 s. `cpuslot run --help` queues
  and waits; use `cpuslot --help`.
