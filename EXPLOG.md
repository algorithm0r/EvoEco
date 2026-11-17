# EvoEco — EXPLOG (experiment ledger)
Newest entry on top. **Append only — never edit past entries.**

**What this is:** the record of experiments: the question asked, the exact settings, the numbers.
DEVLOG says what changed in the *code*; EXPLOG says what we *learned from runs* and how to
reproduce it.

**Protocol** (Chris's, RLLayers 2026-07-28; standard for every project since 2026-11-13;
conventions §4). Any script that imports `exp.mjs` (runner.mjs and every probe) takes the flags:
1. **Register:** `node <script> --register <slug> "<one-line question>"` claims the next number
   (`expNNN`) in Mongo and prints a stub.
2. **Pre-register** here, BEFORE running, under `## expNNN — <question>`: the script, the
   settings that differ from defaults, the colony it starts from, seeds, reps, run length and the
   measures. It's a checkpoint to second-guess any undiscussed change. The script refuses
   `--exp expNNN` until this heading exists.
3. **Run:** `cpuslot run --tag evoeco --desc "EvoEco expNNN ..." -- node <script> --exp expNNN ...`.
   Every run lands in Mongo (`evoeco.expNNN_<slug>`, the record) and `results/expNNN_<slug>/`
   (JSON copies, and any colonies the runs save).
4. **Raw results only** under the same heading once the data is in: numbers, no narration, no
   conclusions. Conclusions are drawn separately, later.

Adding runs to an existing experiment: add a dated `**Added runs:**` block to its entry first.
Cite results anywhere (DEVLOG, STATUS, paper) by `expNNN`. Checks nothing will cite run with
`--scratch` and are not logged here.

Runs before 2026-11-13 were not registered. Their output is in `../analysis/archive/` (see its
README), and DEVLOG cites them by file name.

<!-- append new entries below this line, newest first -->

## exp011 — Does a hungry mother's gift to her neediest weaned child still pay her if her own death in her projection is priced as the injury forecast prices it, with her weights on her dependents?
**Pre-registered:** 2026-11-17
**Script:** probes/mothergift.mjs (since exp011 it also computes her cost with `WORST_NEED_COST`
scaled by 1 + Σ her weights on her living charges (`weightOn`), as `injuryCost` prices death,
for her sum alone, restored at once).
**Code:** as exp007–010 (past `267c629`, uncommitted; no model change).
**Settings:** as exp009–010: the colonies' saved parameters, `--set injury.minorCut=0.6`;
`exp002/limit_s1_y30` 7 years and `exp002/limit_s2_y10` 10 years; runs `exp002_limit_s1_y30`,
`exp002_limit_s2_y10`.
**Seeds / reps / length:** the two colonies, one run each, 7 and 10 years.
**Measures:** exp010's, plus by her food level: the gift pays with her death priced with her
dependents (weight × gain as is > her cost so priced), mean that cost, mean Σ weights.

**Results (raw, 2026-11-17):** both runs complete (`results/exp011_mother-death-deps/`). Days and
"pays" equal exp009's; "pays w/ inflow" equals exp010's (454, 855). Columns: her level; days;
pays (as is); pays with her death priced with her dependents; mean her cost (as is); mean her
cost so priced; mean weight × child's gain; mean Σ her weights on her charges.

| level | s1 days | s1 pays | s1 pays w/ deps | s1 loss | s1 loss w/ deps | s1 w×gain | s1 Σw | s2 days | s2 pays | s2 pays w/ deps | s2 loss | s2 loss w/ deps | s2 w×gain | s2 Σw |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| −6 | 68 | 37 | 37 | 106.31 | 226.88 | 2.062 | 1.063 | 49 | 33 | 33 | 99.18 | 183.89 | 2.295 | 0.880 |
| −5 | 71 | 51 | 51 | 1.471 | 2.802 | 2.182 | 1.185 | 102 | 64 | 64 | 21.55 | 57.75 | 2.066 | 1.190 |
| −4 | 75 | 53 | 53 | 1.462 | 2.588 | 2.088 | 1.048 | 166 | 111 | 111 | 5.268 | 14.49 | 2.324 | 1.316 |
| −3 | 80 | 57 | 57 | 1.399 | 2.531 | 2.224 | 1.180 | 174 | 113 | 113 | 1.851 | 5.292 | 2.401 | 1.348 |
| −2 | 94 | 71 | 71 | 1.297 | 2.192 | 2.410 | 1.111 | 223 | 158 | 158 | 1.012 | 1.275 | 2.631 | 1.263 |
| −1 | 146 | 117 | 117 | 1.057 | 1.691 | 2.267 | 1.131 | 311 | 230 | 230 | 0.946 | 1.355 | 2.626 | 1.361 |
| all | 534 | 386 | 386 | | | | | 1025 | 709 | 709 | | | | |

## exp010 — Does a hungry mother's gift to her neediest weaned child still pay her if the child's projection counts the food it usually receives (its last 30 days) instead of nothing coming in?
**Pre-registered:** 2026-11-16
**Script:** probes/mothergift.mjs (since exp010 it also tracks each weaned child's food received
through exchange over its last 30 days, and computes the child's gain with that mean added to
its projection each day; with nothing received the two gains agree, checked on a scratch run).
**Code:** as exp007–009 (past `267c629`, uncommitted; no model change).
**Settings:** as exp009: the colonies' saved parameters, `--set injury.minorCut=0.6`;
`exp002/limit_s1_y30` 7 years and `exp002/limit_s2_y10` 10 years; runs `exp002_limit_s1_y30`,
`exp002_limit_s2_y10`.
**Seeds / reps / length:** the two colonies, one run each, 7 and 10 years.
**Measures:** exp009's, plus by her food level: the gift pays with the child's usual inflow
counted (weight × gain with inflow > her cost as is), mean weight × gain with inflow, mean
child inflow a day.

**Results (raw, 2026-11-16):** both runs complete (`results/exp010_child-inflow/`). Days,
"pays", "gave" and "died ≤30 d" equal exp009's in every row (same runs). Columns: her level;
days; pays (nothing coming in, as is); pays with the child's usual inflow counted; gave; died
≤30 d; mean her cost; mean weight × gain (as is); mean weight × gain with inflow; mean child
inflow a day (food-level units).

| level | s1 days | s1 pays | s1 pays w/ inflow | s1 w×gain | s1 w×gain w/ inflow | s1 inflow | s2 days | s2 pays | s2 pays w/ inflow | s2 w×gain | s2 w×gain w/ inflow | s2 inflow |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| −6 | 68 | 37 | 53 | 2.062 | 5.064 | 0.327 | 49 | 33 | 37 | 2.295 | 5.406 | 0.311 |
| −5 | 71 | 51 | 64 | 2.182 | 5.420 | 0.319 | 102 | 64 | 77 | 2.066 | 4.898 | 0.296 |
| −4 | 75 | 53 | 66 | 2.088 | 4.958 | 0.336 | 166 | 111 | 127 | 2.324 | 5.142 | 0.346 |
| −3 | 80 | 57 | 72 | 2.224 | 5.337 | 0.341 | 174 | 113 | 144 | 2.401 | 5.772 | 0.322 |
| −2 | 94 | 71 | 82 | 2.410 | 4.947 | 0.328 | 223 | 158 | 202 | 2.631 | 6.128 | 0.335 |
| −1 | 146 | 117 | 117 | 2.267 | 4.522 | 0.320 | 311 | 230 | 268 | 2.626 | 5.934 | 0.324 |
| all | 534 | 386 | 454 | | | | 1025 | 709 | 855 | | | |

## exp009 — When a hungry mother weighs a day's food for her neediest weaned child, does the gift pay her, and would it still pay if her projection kept her hunger instead of fading it back toward her usual level?
**Pre-registered:** 2026-11-16
**Script:** probes/mothergift.mjs
**Code:** as exp007–008 (past `267c629`, uncommitted; no model change).
**Settings:** as saved in the colonies, except `--set injury.minorCut=0.6`. Starts from
`exp002/limit_s1_y30` run 7 years and `exp002/limit_s2_y10` run 10 years. Runs
`exp002_limit_s1_y30`, `exp002_limit_s2_y10`. The probe calls the model's own cost functions
before each day's gifts and sets, then restores, the mother's `livedFood`; if any of this draws
on the generator or leaves a cache changed, the runs diverge from exp007–008.
**Seeds / reps / length:** the two colonies, one run each, 7 and 10 years.
**Measures:** each day a woman below food level 0 is at exchange with a weaned child in her care
below food level 1 (her neediest such child), the model's gift sum for one day of its food in
the food she holds most of: her cost of giving it, her weight on the child, the child's gain,
whether it pays. The same sum with her `livedFood` (all seasons) set to her food level now (her
hunger kept, not faded). Her usual level as read; whether she gave food that day; whether she
died of hunger within 30 days. Tallied by her food level [−6,−5) … [−1,0).

**Results (raw, 2026-11-16):** both runs complete (`results/exp009_mother-gift-sum/`). Columns:
her level; days; the sum pays; pays with her hunger kept; she gave food; she died of hunger
within 30 days; mean her cost (as is); mean her cost (hunger kept); mean weight × child's gain;
mean her usual level as read.

From `limit_s1_y30`, 7 years:

| level | days | pays | pays kept | gave | died ≤30 d | loss | loss kept | w×gain | usual |
|---|---|---|---|---|---|---|---|---|---|
| −6 | 68 | 37 | 48 | 56 | 10 | 106.31 | 29.25 | 2.062 | −1.451 |
| −5 | 71 | 51 | 55 | 58 | 8 | 1.471 | 3.596 | 2.182 | −0.994 |
| −4 | 75 | 53 | 53 | 67 | 5 | 1.462 | 3.640 | 2.088 | −0.877 |
| −3 | 80 | 57 | 58 | 71 | 5 | 1.399 | 1.354 | 2.224 | −0.480 |
| −2 | 94 | 71 | 74 | 91 | 15 | 1.297 | 1.323 | 2.410 | 0.049 |
| −1 | 146 | 117 | 110 | 128 | 6 | 1.057 | 1.970 | 2.267 | 0.337 |
| all | 534 | 386 | 398 | 471 | 49 | | | | |

From `limit_s2_y10`, 10 years:

| level | days | pays | pays kept | gave | died ≤30 d | loss | loss kept | w×gain | usual |
|---|---|---|---|---|---|---|---|---|---|
| −6 | 49 | 33 | 42 | 38 | 27 | 99.18 | 5.251 | 2.295 | −1.534 |
| −5 | 102 | 64 | 76 | 93 | 33 | 21.55 | 1.471 | 2.066 | −1.041 |
| −4 | 166 | 111 | 108 | 155 | 41 | 5.268 | 5.349 | 2.324 | −0.766 |
| −3 | 174 | 113 | 129 | 161 | 33 | 1.851 | 1.635 | 2.401 | −0.279 |
| −2 | 223 | 158 | 155 | 205 | 16 | 1.012 | 5.207 | 2.631 | 0.047 |
| −1 | 311 | 230 | 224 | 287 | 16 | 0.946 | 1.148 | 2.626 | 0.382 |
| all | 1025 | 709 | 734 | 939 | 166 | | | | |

## exp008 — Why do mothers starve: in the 45 days before a woman with children in her care dies of hunger, what does she gather, hold, eat and pass to her children through exchange, against other mothers in her camp who live through the same days?
**Pre-registered:** 2026-11-16
**Script:** probes/mothersprobe.mjs
**Code:** as exp007 (past `267c629`, uncommitted; no model change).
**Settings:** as saved in the colonies, except `--set injury.minorCut=0.6`. Starts from
`exp002/limit_s1_y30` run 7 years and `exp002/limit_s2_y10` run 10 years (exp007's colonies and
spans). Runs `exp002_limit_s1_y30`, `exp002_limit_s2_y10`. The probe wraps nothing in the model.
**Seeds / reps / length:** the two colonies, one run each, 7 and 10 years.
**Measures:** for every woman with children alive in her care, a daily record over the last 45
days: her evening food level; food held after the evening (hand and store); food gathered;
her net food through exchange (gifts and barter, out negative); her charges' net food through
exchange, their mean food level, their number and infants; her hours after care. Food in
food-level units. For each such woman dead of hunger: her window, and the same days for up to
two other women with children in her camp alive at the end.

**Results (raw, 2026-11-16):** both runs complete (`results/exp008_mothers-starve/`;
`python probes/exp008sum.py`, which prints each case too).
- Cases: 9 mothers dead of hunger (s1), with 18 peer windows; 15 (s2), with 24.
- Each cell is the daily mean over the window's first 30 days → its last 15. "Ate" is by
  balance: held before + gathered + exchange net − held after.

| | s1 dead | s1 peers | s2 dead | s2 peers |
|---|---|---|---|---|
| evening food level | −0.32 → −3.74 | 0.32 → −0.83 | −0.91 → −3.92 | 0.75 → 0.35 |
| food held | 0.59 → 0.00 | 5.11 → 4.47 | 0.53 → 0.00 | 2.61 → 1.00 |
| gathered | 0.52 → 0.43 | 0.63 → 0.54 | 0.62 → 0.57 | 0.74 → 0.68 |
| her net through exchange | −0.36 → −0.33 | −0.36 → −0.32 | −0.36 → −0.44 | −0.35 → −0.35 |
| her charges' net through exchange | 0.52 → 0.49 | 0.48 → 0.47 | 0.61 → 0.63 | 0.55 → 0.56 |
| ate | 0.21 → 0.10 | 0.31 → 0.28 | 0.29 → 0.13 | 0.51 → 0.35 |
| children in care | 3.10 → 3.11 | 2.61 → 2.61 | 3.49 → 3.53 | 2.63 → 2.72 |
| infants in care | 0.88 → 0.89 | 0.62 → 0.61 | 0.82 → 0.80 | 0.61 → 0.58 |
| hours after care | 8.01 → 8.21 | 10.16 → 10.00 | 8.61 → 8.70 | 10.98 → 11.01 |

## exp007 — exp006 with its build fault fixed (a weaned child shares its carer's drinking and also drinks for itself at water where it is): who dies, of what, at what age, from the same colonies and spans; and were the women who starve carers?
**Pre-registered:** 2026-11-16
**Script:** probes/deathprobe.mjs (as exp006).
**Code:** past `267c629` (uncommitted): exp006's three changes, with change 1 fixed: a child
shares its carer's drinking (her evening water) as before, and from weaning also drinks for
itself at water anywhere it was with her (`followCarer`, `dependentEvening`). Smoke PASS,
including a check that fails on exp006's build (child water −0.3 with its carer at 0.9).
**Settings:** as saved in the colonies, except `--set injury.minorCut=0.6`. Starts from
`exp002/limit_s1_y30` run 7 years and `exp002/limit_s2_y10` run 10 years. Runs
`exp002_limit_s1_y30`, `exp002_limit_s2_y10`.
**Seeds / reps / length:** the two colonies, one run each, 7 and 10 years.
**Measures:** as exp006. Compared against exp005 and exp002 over the same years.

**Results (raw, 2026-11-16):** both runs complete (`results/exp007_self-care-fixed/`;
`python probes/exp005sum.py exp007_self-care-fixed`); saved `_parameters.injury.minorCut` 0.6.

| group | s1 hunger | s1 injury | s1 old age | s1 thirst | s2 hunger | s2 injury | s2 old age | s2 thirst |
|---|---|---|---|---|---|---|---|---|
| infant | 8 | 0 | 0 | 0 | 12 | 0 | 0 | 0 |
| child 2–14 | 17 | 0 | 0 | 0 | 40 | 0 | 0 | 0 |
| woman 15–44 | 9 | 1 | 0 | 0 | 14 | 2 | 0 | 0 |
| man 15–44 | 6 | 0 | 1 | 4 | 2 | 1 | 1 | 0 |
| woman 45+ | 1 | 1 | 5 | 0 | 1 | 1 | 1 | 0 |
| man 45+ | 2 | 1 | 5 | 0 | 2 | 0 | 4 | 0 |

s1: 61 deaths; s2: 81.
- Thirst, s1: four men aged 17–31, all on day 4.08 y, food 1, none hurt. s2: none.
- Women dead, as they woke that day: with children in their care 11 of 17 (s1), 18 of 19 (s2).
  Of those dead of hunger: 9 of 10 (s1), 15 of 15 (s2). None hurt.
- Children dead of hunger, carer alive / mother alive: s1 17 / 9 of 25; s2 40 / 22 of 52.
- Hunger deaths by quarter of the year (0 = the colony's year start, spring), s1: 11 / 6 / 1 /
  25; s2: 30 / 2 / 15 / 24.
- s1 adult hunger deaths cluster at years 0.94–0.98 (5), 2.96–3.02 (6), 4.75–4.91 (3).
- Census (alive/adults/children/infants/women with charges):
  - s1: y0 163/99/64/15/23 → y7 136/77/59/8/16.
  - s2: y0 151/77/74/17/29 → y10 112/64/48/4/13.
- Against exp005 (same colonies and spans): child thirst 0 vs 13 (s1), 0 vs 9 (s2); adult hunger
  18 vs 17, 19 vs 22; child hunger (infants included) 25 vs 15, 52 vs 47; alive at the end 136
  vs 136, 112 vs 97. exp002, the same years: adult hunger 11, 3; child hunger 29, 49; alive 145,
  128.

## exp006 — With weaned children drinking on their own, care never taking a carer's drinking hours, and a minor injury keeping 60% of the day (all 2026-11-16), who dies, of what, at what age, from the same colonies and spans as exp005; and were the women who starve carers?
**Pre-registered:** 2026-11-16
**Script:** probes/deathprobe.mjs (since exp006 each death also carries `woke`: as it woke that
day, children alive in its care, injury, hours after care, care, carer id; exp005's `charges`
read 0 because a dead carer's charges are passed on within the day).
**Code:** past `267c629` (uncommitted). Three model changes from exp005:
1. From weaning a child drinks at water anywhere it was with its carer, camp included, whatever
   its carer did (`followCarer`, `dependentEvening`; ODD §7.4 Children drink and eat on their
   own, Decided 2026-11-16, build Default).
2. Care never takes the hours a carer needs to drink, her drink trip; care beyond that lapses
   (`careTaken`, used in `capacity` and the injury forecast; ODD §7.4 A hurt carer puts her own
   recovery first, Decided 2026-11-16, build Default).
3. `injury.minorCut` 0.3 → 0.6 (Default 2026-11-16).
**Settings:** as saved in the colonies, except `--set injury.minorCut=0.6` (a colony's saved
parameters override current defaults, so the new default is set after loading). Starts from `exp002/limit_s1_y30` run 7 years and
`exp002/limit_s2_y10` run 10 years. Runs `exp002_limit_s1_y30`, `exp002_limit_s2_y10`.
**Seeds / reps / length:** the two colonies, one run each, 7 and 10 years.
**Measures:** exp005's, plus `woke` per death. Compared against exp005 and exp002 over the same
years.

**Results (raw, 2026-11-16):** `limit_s1_y30` complete (`results/exp006_self-care/exp002_limit_s1_y30.json`;
`python probes/exp005sum.py exp006_self-care`); saved `_parameters.injury.minorCut` 0.6.
`limit_s2_y10` was stopped part way and saved nothing.
- **Build fault:** change 1 as built dropped a child's sharing of its carer's drinking (her
  evening water, gourd included), so a weaned child away from water did not drink. The fault
  is fixed and re-run as exp007; these numbers are from the faulty build.
- s1, 60 deaths:

| group | hunger | injury | old age | thirst |
|---|---|---|---|---|
| infant | 5 | 0 | 0 | 0 |
| child 2–14 | 12 | 0 | 1 | 13 |
| woman 15–44 | 7 | 0 | 0 | 0 |
| man 15–44 | 1 | 1 | 0 | 0 |
| woman 45+ | 1 | 0 | 5 | 0 |
| man 45+ | 3 | 2 | 9 | 0 |

- Children dead of thirst: ages 2.3–3.6; carer alive 13 of 13, mother alive 12 of 13.
- Women dead, as they woke that day: 8 of 13 had children in their care. Of the 8 dead of
  hunger, 7 had 2–5 children in their care (care 2–4.5 h, hours after care 2.9–12); none hurt.
- Census (alive/adults/children/infants/women with charges): y0 163/99/64/15/23 → y7
  143/83/60/8/18.

## exp005 — Under the projected-need and neediest-first gift rules, who dies, of what, at what age, from the same colonies and spans as exp004: do adults (mothers in particular) die more, and where do the infant, child-thirst and other child hunger deaths come from?
**Pre-registered:** 2026-11-16
**Script:** probes/deathprobe.mjs
**Code:** the same model code as exp004 (working tree past `fefbe89`, or the commit that carries
it if committed first; no model change between).
**Settings:** defaults (as saved in the colonies). Starts from `exp002/limit_s1_y30` run 7 years
and `exp002/limit_s2_y10` run 10 years. Runs `exp002_limit_s1_y30`, `exp002_limit_s2_y10`. The
probe wraps nothing in the model, so a run may differ from exp004's only if exp004's probe drew on
the generator.
**Seeds / reps / length:** the two colonies, one run each, 7 and 10 years.
**Measures:** every death, the day it happens: age, sex, cause, food and water levels, child,
infant, children alive in its care; for a child, carer alive and mother alive. Yearly census:
alive, adults, children, infants, women with children in their care. Tally of cause by age group
(infant; child 2–14; adult 15–44, 45+, by sex). Compared against exp002's seasons table (deaths
by cause, adult and child) over the same years.

**Results (raw, 2026-11-16):** both runs complete (`results/exp005_deaths/exp002_limit_s1_y30.json`,
`exp002_limit_s2_y10.json`; summarizer `probes/exp005sum.py`). Deaths by group and cause:

| group | s1 hunger | s1 injury | s1 old age | s1 thirst | s2 hunger | s2 injury | s2 old age | s2 thirst |
|---|---|---|---|---|---|---|---|---|
| infant | 6 | 0 | 0 | 3 | 12 | 0 | 0 | 3 |
| child 2–14 | 9 | 0 | 0 | 10 | 35 | 0 | 0 | 6 |
| woman 15–44 | 8 | 0 | 0 | 4 | 13 | 1 | 0 | 2 |
| man 15–44 | 0 | 3 | 1 | 0 | 2 | 3 | 0 | 0 |
| woman 45+ | 1 | 0 | 6 | 0 | 4 | 0 | 2 | 1 |
| man 45+ | 8 | 0 | 4 | 0 | 3 | 0 | 6 | 0 |
| all | | | | | | | | |

s1: 63 deaths; s2: 93.
- exp002 over the same years: s1 adult hunger 11, injury 1, old age 13, thirst 1; child hunger
  29, thirst 5. s2 adult hunger 3, injury 4, old age 9, thirst 1; child hunger 49, thirst 4.
- Children dead of thirst with carer alive / mother alive: s1 0/0 of 13, s2 0/0 of 9.
- Children dead of hunger, the same: s1 9/6 of 15, s2 35/19 of 47.
- Thirst deaths by day (a woman and children dying the same day):
  - s1: 0.28 y (F 27.2 and 4 children), 1.54 (F 29.6 and 3), 2.98 (F 27.6 and 3), 5.61 (F 26.4
    and 3). All 17 of s1's thirst deaths are in these four groups.
  - s2: 0.20 (F 31.6 and 2), 0.61 (F 28.6 and 2), 2.95 (F 45.1 and 5).
- Adult hunger deaths in s2 (year, sex, age): 17 of 22 are women, 12 of them aged 29–43 in years
  1.7–4.8.
- **Instrument fault:** "women dead with children in care" reads 0 of 19 (s1) and 0 of 23 (s2).
  The probe reads charges after the day's update, by which time a dead carer's charges have been
  passed on, so this measure is void.
- Census at years 0 and end (alive / adults / children / infants / women with charges):
  - s1: 163/99/64/15/23 → 136/76/60/8/15.
  - s2: 151/77/74/17/29 → 97/56/41/3/13.

## exp004 — With a child's need projected over its coming days (Decided 2026-11-14), do carers holding food feed their hungry children: how many child-days are spent in deficit and at the brink, how often does a day's food pay, and how many children die of hunger, from the same colonies and spans as exp003?
**Pre-registered:** 2026-11-15
**Script:** probes/giftprobe.mjs (since exp004 it also totals child-days past nursing, children's
deaths by cause, births, and the living and adults at the end; exp003's measures unchanged).
**Code:** working tree past `fefbe89` (uncommitted). Two model changes from exp003, both in
`exchange.js`:
1. `needsCost` for a child with a carer, past nursing: its evening, then its coming days one at
   a time to a year at discount 0.99, eating what it holds, nothing coming in, other needs held
   at tonight's; the night that kills costs its evening, every day after it the worst cost (ODD
   §7.4 Gifts to children, Decided 2026-11-14; day-by-day build Default). Before: its evening
   only, plus the worst cost on every projected day if tonight would kill it.
2. `giftsAt`: of those short of a good at a place, the gift that pays its giver most goes first,
   until none pays (ODD §2 Ties, Who is given to first, Decided 2026-11-15). Before: receivers
   in stored order, oldest-born first. Each giver still gives a receiver at most once per good.
**Settings:** defaults (as saved in the colonies). Starts from the same exp002 colonies as
exp003: `exp002/limit_s1_y30` run 7 years, `exp002/limit_s2_y10` run 10 years. Runs
`exp002_limit_s1_y30`, `exp002_limit_s2_y10`. The colonies' children start as the old rule left
them (many deep in deficit), so the first weeks are a transition.
**Seeds / reps / length:** the two colonies, one run each, 7 and 10 years.
**Measures:** exp003's, by the child's level [−6,−5) … [−1,0); plus the totals above; plus, on
days the sum says a day's food pays but the child got none, where the carer's gifts went that
day (another of her charges, another child, an adult, nobody).

**Results (raw, 2026-11-15):** both runs complete (`results/exp004_child-projection/exp002_limit_s1_y30.json`,
`exp002_limit_s2_y10.json`; summarizer `probes/exp004sum.py`). Columns as exp003, plus: days the
sum paid but the child got no food; on those days, the carer's gifts went to another of her
charges / another child / an adult / nobody (a day can count in more than one).

From `limit_s1_y30`, 7 years:

| level | days | in hand | store | got | died | pays | loss | weight | w×gain | carer | paid, got none | charge / child / adult / nobody |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| −6 | 51 | 32 | 0 | 22 | 9 | 10/32 | 0.626 | 0.213 | 1.394 | −0.77 | 3 | 3 / 0 / 0 / 0 |
| −5 | 87 | 64 | 0 | 44 | 0 | 32/66 | 1.246 | 0.193 | 1.104 | 0.26 | 6 | 4 / 2 / 0 / 0 |
| −4 | 104 | 75 | 0 | 44 | 0 | 44/83 | 1.152 | 0.210 | 1.324 | 0.47 | 15 | 11 / 4 / 1 / 0 |
| −3 | 122 | 84 | 0 | 62 | 0 | 49/89 | 0.520 | 0.187 | 1.136 | 0.59 | 17 | 13 / 5 / 0 / 0 |
| −2 | 196 | 155 | 1 | 95 | 0 | 88/163 | 0.910 | 0.207 | 1.290 | 0.55 | 35 | 25 / 13 / 0 / 0 |
| −1 | 502 | 386 | 1 | 258 | 0 | 176/388 | 0.913 | 0.185 | 1.175 | 0.28 | 42 | 34 / 8 / 0 / 0 |
| all | 1062 | 796 | | 525 | 9 | 399/821 | | | | | 118 | |

Totals: child-days past nursing with a carer 127427; children's deaths hunger 15, thirst 13;
births 36; at the end 136 alive, 76 adults.

From `limit_s2_y10`, 10 years:

| level | days | in hand | store | got | died | pays | loss | weight | w×gain | carer | paid, got none | charge / child / adult / nobody |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| −6 | 169 | 95 | 0 | 57 | 35 | 51/134 | 0.423 | 0.240 | 0.869 | 0.64 | 18 | 15 / 3 / 0 / 0 |
| −5 | 218 | 126 | 0 | 95 | 0 | 90/180 | 0.745 | 0.226 | 0.921 | 0.87 | 33 | 26 / 8 / 1 / 0 |
| −4 | 324 | 220 | 0 | 158 | 0 | 116/270 | 0.585 | 0.210 | 0.924 | 0.88 | 31 | 27 / 5 / 1 / 0 |
| −3 | 410 | 266 | 0 | 215 | 0 | 140/334 | 0.610 | 0.223 | 0.958 | 0.90 | 30 | 26 / 5 / 0 / 0 |
| −2 | 714 | 406 | 6 | 400 | 0 | 252/535 | 2.392 | 0.252 | 1.076 | 0.78 | 50 | 43 / 8 / 1 / 0 |
| −1 | 1496 | 859 | 19 | 846 | 0 | 578/1075 | 1.618 | 0.264 | 1.193 | 0.77 | 113 | 95 / 18 / 5 / 0 |
| all | 3331 | 1972 | | 1771 | 35 | 1227/2528 | | | | | 275 | |

Totals: child-days past nursing with a carer 194558; children's deaths hunger 47, thirst 9;
births 39; at the end 97 alive, 56 adults.

Same spans in exp002 (old rule; seasons table of `results/exp002_founding-wave/limit_s{1,2}.json`):
s1 years 30–37, start 163 alive (99 adults), end 145 (87 adults), births 42, children's deaths
hunger 29, thirst 5. s2 years 10–20, start 151 (77 adults), end 128 (80 adults), births 47,
children's deaths hunger 49, thirst 4. In exp003 (old rule, the probe's spans): child-days in
deficit 91475 (s1) and 130165 (s2); died in deficit 27 and 50.

## exp003 — When a child with a carer is in food deficit, does its carer hold food at exchange time, and does the model's gift sum say giving a day's food pays her?
**Pre-registered:** 2026-11-15
**Script:** probes/giftprobe.mjs
**Code:** working tree past `fefbe89` (uncommitted), the same model code as exp001–002.
**Settings:** defaults (as saved in the colonies). Starts from exp002 colonies: `exp002/limit_s1_y30`
(child hunger 11 and 24 in years 31–35 and 36–40) run 7 years; `exp002/limit_s2_y10` (26 and 23
in years 11–15 and 16–20) run 10 years. Runs `exp002_limit_s1_y30`, `exp002_limit_s2_y10`.
The probe calls the model's own cost functions (`costWith`, `needsCost`) before each day's
gifts; if these draw on the generator, the runs diverge from exp002's.
**Seeds / reps / length:** the two colonies above, one run each, 7 and 10 years.
**Measures:** every day a child with a carer (not an infant) is below food level 0, at exchange
time, bucketed by the child's level [−6,−5) … [−1,0): child-days; carer held ≥ one day of the
child's food in hand; in her store; the child got food that day; the child died that day; the
model's gift sum for one day of the child's food in the food she holds most of (her cost of
giving it, her weight on the child, the child's gain, weight × gain, whether it pays: weight ×
gain > her cost); mean carer food level. Up to 400 child-days below −4.5 kept whole.

**Results (raw, 2026-11-15):** both runs complete (`results/exp003_child-gifts/exp002_limit_s1_y30.json`,
`exp002_limit_s2_y10.json`). Columns: child's level; child-days; carer held ≥ 1 day of the
child's food in hand; in store; child got food; child died; gift sum pays / sums run; mean
carer cost of giving; mean weight; mean weight × child gain; mean carer food level.

From `limit_s1_y30`, 7 years:

| level | days | in hand | store | got | died | pays | loss | weight | w×gain | carer |
|---|---|---|---|---|---|---|---|---|---|---|
| −6 | 42933 | 38475 | 110 | 21274 | 24 | 12923/39565 | 1.441 | 0.335 | 105.99 | 0.75 |
| −5 | 13546 | 12777 | 73 | 3589 | 1 | 1453/12891 | 0.769 | 0.327 | 0.036 | 0.89 |
| −4 | 9741 | 9309 | 57 | 2624 | 0 | 925/9356 | 0.970 | 0.333 | 0.033 | 0.97 |
| −3 | 8498 | 8210 | 61 | 2218 | 1 | 835/8241 | 0.765 | 0.333 | 0.030 | 1.00 |
| −2 | 7977 | 7751 | 68 | 2008 | 1 | 796/7728 | 0.638 | 0.335 | 0.026 | 1.02 |
| −1 | 8780 | 8588 | 73 | 2241 | 0 | 895/8498 | 0.635 | 0.332 | 0.023 | 1.03 |
| all | 91475 | 85110 | | 33954 | 27 | 17827/86279 | | | | |

From `limit_s2_y10`, 10 years:

| level | days | in hand | store | got | died | pays | loss | weight | w×gain | carer |
|---|---|---|---|---|---|---|---|---|---|---|
| −6 | 61331 | 53817 | 221 | 30518 | 48 | 17717/55967 | 0.908 | 0.292 | 95.69 | 0.91 |
| −5 | 20689 | 19213 | 134 | 4921 | 2 | 2149/19466 | 0.703 | 0.300 | 0.037 | 0.96 |
| −4 | 14197 | 13339 | 96 | 3343 | 0 | 1429/13514 | 0.745 | 0.297 | 0.033 | 1.00 |
| −3 | 11753 | 11157 | 85 | 2864 | 0 | 1340/11296 | 0.716 | 0.292 | 0.029 | 1.01 |
| −2 | 10787 | 10292 | 82 | 2783 | 0 | 1286/10412 | 0.595 | 0.292 | 0.026 | 1.02 |
| −1 | 11408 | 11029 | 120 | 3115 | 0 | 1467/11081 | 0.617 | 0.295 | 0.023 | 1.03 |
| all | 130165 | 118847 | | 47544 | 50 | 25388/121736 | | | | |

For scale: in exp002 over the same spans, all children alive (infants included) came to
172800 child-days (s1, years 30–37) and 228600 (s2, years 10–20). Year = 360 days.

## exp002 — Starting from 100 adults and no children, does the birth/death wave settle after a generation or two over 40 years, or keep pulsing; and when children die of hunger, did their carers and camp hold food?
**Pre-registered:** 2026-11-14
**Script:** probes/carryprobe.mjs (as for exp001, plus births, the age profile, the hunger trace
and colony saves; changes made 2026-11-14 before this run)
**Code:** working tree past `fefbe89` (uncommitted), the same model code as exp001.
**Settings:** defaults; arm `limit`. Fresh worlds (100 adults, ages uniform 15–45, no children;
ODD §5 Starting ages). `--save`: colony every 10 years (`limit_s<seed>_y{10,20,30,40}`), as
candidate burn-in starts.
**Seeds / reps / length:** seeds 1, 2, 3; one run each (`limit_s1..3`); 40 years.
**Measures:** the exp001 season rows, plus births per season and the age profile (5-year bins,
the last 60+). For each child that dies of hunger, on the day it died: its age, infant or not,
food-days it held, mother alive; its carer (alive, is the mother, food level, food-days held,
other children in care); its carer's camp (adults, food-days held by them, per adult).
Food-days include stores; caches lying in the world are only in the season total.

**Results (raw, 2026-11-14):** all three runs complete (`results/exp002_founding-wave/limit_s{1,2,3}.json`,
colonies `limit_s<seed>_y{10,20,30,40}.colony.bin`). Summed by `probes/exp002sum.py` (per year)
and an inline 5-year sum of the same JSON.

By 5-year span: alive/adults at its end, births, child hunger deaths, adult hunger deaths, other deaths.

| years | s1 | s2 | s3 |
|---|---|---|---|
| 1–5 | 160/98, 63, 1, 0, 2 | 150/93, 57, 0, 0, 7 | 158/95, 63, 0, 0, 5 |
| 6–10 | 165/90, 49, 36, 3, 5 | 151/77, 52, 29, 6, 16 | 127/80, 46, 61, 10, 6 |
| 11–15 | 143/78, 25, 23, 1, 23 | 142/71, 27, 26, 1, 9 | 115/71, 16, 15, 1, 12 |
| 16–20 | 139/91, 18, 6, 1, 15 | 128/80, 20, 23, 2, 9 | 113/73, 12, 4, 1, 9 |
| 21–25 | 151/98, 25, 3, 2, 8 | 135/76, 35, 9, 5, 14 | 114/77, 18, 10, 1, 6 |
| 26–30 | 163/99, 36, 5, 3, 16 | 114/68, 25, 19, 9, 18 | 115/75, 18, 0, 1, 16 |
| 31–35 | 162/92, 31, 11, 3, 18 | 107/65, 21, 6, 4, 18 | 125/69, 28, 1, 2, 15 |
| 36–40 | 149/89, 34, 24, 11, 12 | 96/61, 23, 6, 6, 22 | 128/67, 28, 4, 0, 21 |

Children alive at year end, s1: peak 84 (year 8), low 45 (year 22), peak 75 (year 33), 60 (year 40).
s2: peak 77 (year 9), 35 (year 40). s3: peak 73 (year 7), low 31 (year 24), 61 (year 40).

Age profile (5-year bins, last 60+):

| year | s1 | s2 | s3 |
|---|---|---|---|
| 10 | 41 34 0 0 0 21 14 20 14 11 10 0 0 | 41 33 0 0 0 11 18 14 10 13 11 0 0 | 28 19 0 0 0 11 17 16 18 6 12 0 0 |
| 20 | 14 17 17 22 0 0 0 17 9 14 13 10 6 | 19 17 12 19 0 0 0 9 16 11 9 10 6 | 11 14 15 12 0 0 0 9 14 13 14 5 6 |
| 30 | 33 20 11 15 14 21 0 0 0 15 7 11 16 | 17 18 11 13 7 9 0 0 0 6 12 7 14 | 17 16 7 9 11 10 0 0 0 8 12 11 14 |
| 40 | 30 13 17 16 5 13 12 14 0 0 0 13 16 | 17 12 6 12 9 9 5 7 0 0 0 5 14 | 28 22 11 14 6 8 8 10 0 0 0 8 13 |

Child hunger trace (s1 / s2 / s3):
- Deaths traced: 109 / 118 / 95; infants 13 / 16 / 10, older 96 / 102 / 85. None had no carer.
- Infants: carer is the mother 13/13, 15/16, 10/10; carer alive at the day's end 0 in every
  case; carer food-days held 0 (median), carer food level −6 (median); camp held ≥ 1 food-day
  per adult 8/13, 12/16, 2/10 (median per adult 2.3, 4.7, 0.3).
- Older children: carer is the mother 83/96, 85/102, 78/85; carer alive 96/96, 102/102, 85/85;
  carer held ≥ 1 food-day 4, 3, 5 (median 0); carer food level ≥ 0.5: 71, 67, 39; 0–0.5: 8, 20,
  23; below 0: 17, 15, 23 (median 0.76, 0.65, 0.46; full is 1, death at −6); carer's other
  children in care, median 1; camp held ≥ 1 food-day per adult 28/96, 29/102, 16/85 (median 0);
  child held ≥ 1 food-day 0 in every case; median age 5.26, 6.33, 4.72.

## exp001 — Does counting the children she already has hold back mothers with full hands, and do fewer children die of hunger over 10 years?
**Pre-registered:** 2026-11-14
**Script:** probes/carryprobe.mjs
**Code:** working tree past `fefbe89` (uncommitted): fetch trips, learned gear returns, and the
mother's crowding cost (`crowding` in `src/life.js`; ODD §7.4 She counts the children she
already has, Decided 2026-11-13).
**Settings:** defaults; arm `limit` (carrying limits on). Fresh worlds, no saved colony.
**Seeds / reps / length:** seeds 1, 2, 3; one run each (`limit_s1`, `limit_s2`, `limit_s3`);
10 years.
**Measures:** one row a season: alive, adults, food held per adult, camp moves, food lying,
gear held and known, deaths by cause, fetch trips, learned gathering returns (`rbare`,
`rbasket`, `rbag`), and the monthly weighings by children in her care (0, 1, 2, 3+):
weighings, found a child worth it, would have without the crowding cost, mean crowding cost (h).
**Baseline (not part of this experiment):** the same probe before the crowding cost, seeds 1–3,
10 years, unregistered: `../analysis/archive/` (`cp_gear10_{1,2,3}.txt`). Child hunger deaths,
years 6–10: 33, 35, 44.

**Results (raw, 2026-11-14):** all three runs complete (`results/exp001_mothers-count/limit_s{1,2,3}.json`).
Summed by `probes/exp001sum.py` (reads the JSON and the baseline files).

Child hunger deaths by year 1–10, and years 6–10:

| seed | baseline | exp001 |
|---|---|---|
| 1 | 0 0 0 0 0 2 4 5 3 19 → 33 | 0 0 0 0 1 0 5 9 14 8 → 36 |
| 2 | 0 0 0 0 0 0 10 10 9 6 → 35 | 0 0 0 0 0 1 20 1 1 6 → 29 |
| 3 | 0 0 0 0 4 0 9 16 12 7 → 44 | 0 0 0 0 0 2 10 27 17 5 → 61 |

At year 10, alive / adults: baseline 162/83, 166/88, 138/80; exp001 165/90, 151/77, 127/80.

All deaths over 10 years, exp001:
- s1: adult hunger 3, adult injury 4, adult old age 3, child hunger 37
- s2: adult hunger 6, adult injury 7, adult old age 8, adult thirst 2, child hunger 29, child thirst 6
- s3: adult hunger 10, adult injury 3, adult old age 7, child hunger 61, child old age 1

Weighings over 10 years, by children in her care: [weighings, found a child worth it, would have
without the crowding cost, mean crowding cost h]:

| seed | 0 | 1 | 2 | 3+ |
|---|---|---|---|---|
| 1 | 330, 298, 303, 608 | 276, 215, 223, 897 | 133, 106, 106, 480 | 42, 33, 33, 526 |
| 2 | 338, 313, 317, 301 | 238, 178, 184, 1116 | 145, 116, 122, 459 | 22, 22, 22, 997 |
| 3 | 348, 266, 270, 598 | 371, 234, 241, 821 | 132, 68, 69, 715 | 12, 7, 8, 1407 |
