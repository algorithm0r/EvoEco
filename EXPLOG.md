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
