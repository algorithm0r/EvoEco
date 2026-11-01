# EvoEco — Model Description (ODD)

*A design bible: amended in place, current truth. History of how decisions were reached goes in
DEVLOG.md. Structure follows the ODD protocol (Grimm et al. 2006; updated 2020).*

**Status:** draft v0.1, 2026-11-01. Built from a question-by-question design conversation between
Chris and Claude. Every entry marked **Decided** was Chris's call (some on Claude's proposal);
**Default** means Claude proposed it and Chris did not object; **Open** means not yet discussed.
No code exists yet.

---

## 1. Purpose and patterns

### Purpose
Measure how **social technologies**, from currency to corporate capital, change the
**wellbeing of individuals**. Each technology is added to a pre-capital foundation economy
and compared with matched runs without it (same agents, landscape, resources and technology).

The headline claim to test: corporate/capital extraction turns an abundant economy into a
scarcity-based one, whatever the scale of total output. Expected signature (Chris's
prediction): the quality of goods consumed by the top rises far while the median stays low,
below what the same economy delivers to its median without extraction.

**Model type — Decided:** a **minimal existence proof**, not a calibrated explanation of real
economies. The reader's own experience ("look around") supplies the rest.

**Design constraint — Default:** rules should be ones a free-market advocate would accept
(self-interested agents, voluntary exchange, no coercion, no villainous owners). If scarcity
emerges anyway, it emerged under their assumptions. Nothing important is baked in: see the
emergent-vs-imposed ledger (§4.2).

A second result the design permits: running the foundation with population growth but no
hoarding technologies separates Malthus (median stagnates from population pressure) from
Chris's reading (median stagnates only once hoarding arrives).

### Patterns the foundation must reproduce (Decided)
- Individuals mostly meet their needs through the economy (production, reciprocity, trade).
- Prices move with supply and demand. Direction only; no commitment to a particular price theory.
- Any further broad economic patterns are welcome as evidence the foundation is sound.

### Technology sequence (Decided, unordered beyond the first)
0. **Foundation:** reciprocity among tied agents, barter between strangers.
1. **Currency.** Key property: storable without loss. Grain-money rots and costs storage;
   currency allows hoarding that was not previously possible. Variant to test: currency with
   decay (Gesell's demurrage).
2. Later, order to be set (candidate source: Sven Beckert, *Capitalism: A Global History*,
   2025 — unverified that this is the book Chris meant): mercantilism, insurance, banking,
   credit, limited liability, publicly traded corporations. Also noted along the way:
   exact debt accounting (gift → credit), kin-only inheritance of property, paid care work.

---

## 2. Entities, state variables and scales

### Agents: individuals (Decided)
- The basic agent is the **individual**.
- **No innate talent, ever, by default.** Talent heterogeneity is a robustness test for final runs only.
- **Heterogeneity is a setting.** Runs can be homogeneous or heterogeneous; within a run, some
  dimensions can be uniform while others vary. Inequality is meant to come from the world
  (resource distribution, location, luck) and from the technologies.
- **Skill from practice:** optional module, not the main source of specialization.
- **Life cycle:** born, age, die.
  - **Childhood is dependent:** children must be fed and cared for until maturity.
  - **Old age declines:** old agents can work less and eventually need care.
  - **Care is labor drawn from rest:** it produces no goods, costs the carer's hours, and flows through ties.

### Households (Decided)
- A **light formal unit**: a pair with a strong mutual tie forms a household, shares shelter,
  decides on children together and pools labor. Membership comes from ties, so households
  form and dissolve as ties do.
- Larger groups (tribes) are **not** entities. They emerge as clusters of strong ties.

### Ties (Decided)
- Primate-level reciprocity: each agent keeps a running, fading tally of what each other agent
  has given it. Willingness to give rises with that tally. Ties that give both ways reinforce
  themselves; ties that stop giving fade.
- **Trust is rough reliability, not an exact ledger.** Exact accounting is a later technology.
- **Power is not a primitive.** It emerges as asymmetric dependence (Emerson 1962): the agent
  many need and who needs few. Intimacy likewise emerges, as tie strength from frequent mutual giving.

### Needs (Decided)
Homeostatic set points:
- **Food, water, warmth (shelter), rest, belonging.**
- Distance below set point is the agent's cost ("surprise"), and the cost is **convex**, so
  whatever is most lacking dominates choice. No fixed weights.
- **Belonging** = basic trust-based reciprocity ties, in both directions (trusting and being
  trusted). An agent short on belonging seeks ties.
- **Rest** = free time; also stands in for higher-order needs.
- **Not needs:** status, conspicuous consumption. High-quality goods count for quality alone.
- **Safety — Default:** not a separate need. Stores matter only as protection of future needs.

### Wellbeing (Decided)
Three parts, **reported separately, never combined into one score** (Default):
1. Quality of goods consumed, per category (food, water, shelter).
2. Rest.
3. Belonging.

### Goods and quality (Decided)
- Goods sit in categories of need, and within each category on a **quality** scale.
- Each quality level has a **recipe**: specific inputs at specific qualities, plus a cost in
  labor and tools. A level can only be produced while the chain supplies its inputs.
- The **supply chain permits the level.** Better tools improve circulation, which allows better
  tools. Breakdown loses key supplies, and production falls back to an earlier level.
- Supply-chain stages (from the opening discussion): extract → process → components →
  assemble → distribute; services; waste/recycling. How many of these the foundation needs is Open.

### Tools (Decided)
- A tool is a **multiplier on production for its task**. Tool quality sets the multiplier.
- Tools wear out and must be repaired or replaced.
- Tools are made from resources and with other tools: the loop that later becomes capital.
  Tool-making is central to the economy.

### Landscape and resources (Decided)
- **Physical space.** Location, distance and placed resources are part of the model. Strangers
  are, roughly, the far away.
- Three resource classes, modeled on reality:
  - **Non-renewables:** finite deposits that must be found and mined (ore, stone).
  - **Renewables:** stocks with their own regrowth rate that can be overused (fields, game, fish, forest).
  - **Water:** its own cycle (rain and season → rivers, springs; flow varies by place and time).
- **Implementation — Default:** one resource mechanism with parameters (starting stock,
  regrowth rate, inflow), so all three classes are the same code with different numbers.
  Start with one instance of each.

### Scales (Decided)
- **One tick = one day.** Each agent has an **hour budget** for the day, spent on travel, work,
  care and rest. Hours are a budget, not simulated steps.
- **Seasons:** a year of days, so harvests vary and stores matter.
- **Runs span generations** (~9,000 days each). Rough cost estimate: a few million agent-days
  per generation for a few hundred agents — fine on one machine if daily planning stays simple.

---

## 3. Process overview and scheduling

**Open.** The daily order (plan → travel → work → exchange → consume → learn → age/birth/death)
has not been discussed.

---

## 4. Design concepts

### 4.1 Basic principles
- Agents are **reactive adaptive agents** in the spirit of **active inference** (Decided), built
  with simple RL rather than as models of humans. "We can build it for them."
- **Minimum effort is the general agent algorithm** (Decided): meet needs while expending the
  fewest resources. Learning itself must be low-effort.
- Pre-monetary exchange follows the anthropology: reciprocity within communities, barter
  between strangers (Graeber 2011, citing Humphrey 1985).

### 4.2 Emergence — the emergent-vs-imposed ledger
These must **emerge** and never be written into a rule:
- households and tribes (clusters of ties); power (asymmetric dependence); intimacy
- specialization and the supply chain
- prices and their response to supply and demand
- inequality of goods, rest and belonging; concentration of ownership (later technologies)
- the growth of needs' quality; collapse and dark ages
- fertility levels, including any demographic transition
- trickle-down **or its absence**. The mechanisms the counter-argument relies on (owner
  reinvestment raising productivity and cheapening goods) are present through the capital
  loop at their real strength; no dedicated trickle-down module is built. (Settled in
  discussion: a special module would bake in the counter-case.)

To be extended as rules are written: every new rule gets checked against this list.

### 4.3 Adaptation and objectives
- Objective: keep homeostatic needs near set points at least effort (§2 Needs).
- **Costs are measured in hours**, and work burns food, so effort feeds back into need (Default).

### 4.4 Learning (Decided — Chris's mechanism)
- One error-driven update rule (prediction error, RL-style), applied to two value tables:
  - **Habits:** updated only from the agent's own experience.
  - **Norms:** updated from every observed experience in the agent's locality, its own
    included. Example: time spent and load brought back from a field — measured for yourself,
    observed for every returner.
- Nobody copies anybody; norms are pooled experience. Conformity and tradition can still emerge.
- **Arbitration — Default (proposed):** weight habit and norm by recent reliability (precision
  weighting: norm as prior, habit as evidence). Equal reliability gives a blend; unequal acts as a switch.
- **Observation is passive and costs no hours**; it happens where agents meet (shelter, field,
  water source). What can be learned depends on where you are.
- Expected consequence: norms carry survivorship bias (you only see those who return).
- **Curiosity term — Default:** a small bonus for uncertain options (the epistemic term of active inference, cheapest form).
- **Particular others — option:** separate models of specific agents, perhaps only for tied
  agents. Norms are the "generalized other" (Mead 1934).

### 4.5 Prediction
- Agents adopt a new quality level when they expect it to save more hours than switching costs (Default).
- Child-bearing is an ROI decision (§7.4).

### 4.6 Sensing
- Agents observe what happens around them (trips, returns, work, trades). Range and fidelity: Open.

### 4.7 Interaction
- **Reciprocity** between tied agents; **barter** between strangers (§7.1–7.2).
- Partner search (how strangers find each other to barter): Open.

### 4.8 Stochasticity
- Discovery of new quality levels is stochastic (§7.3). Resource yields vary by season. Others: Open.

### 4.9 Collectives
- Households (light formal unit); tribes as emergent tie clusters.

### 4.10 Observation (what we measure)
- Per category, the 10th, 50th, 90th and 99th percentiles of quality consumed, over time.
- Rest (hours free per day), belonging (tie measures), both as distributions.
- Comparison is always against the matched run without the technology, at the same total output.
- Productivity scaling runs (1×, 10×, 100×) for the "no matter the scale" claim.
- Further output measures: Open.

---

## 5. Initialization

**Open.**

## 6. Input data

None planned (existence proof, no calibration). **Open** for later stylized-fact checks.

---

## 7. Submodels

### 7.1 Reciprocity (Decided, Default details)
An agent short on something asks tied agents nearby. A tied agent gives if it has surplus
beyond its own buffer, with willingness scaled by the tie tally. Trust rises in both
directions when gifts come back and fades when they don't.

### 7.2 Barter and price (Decided)
- Each agent values a good by its estimate of the hours it would cost to get it itself,
  adjusted by need (homeostatic state). A trade happens when both sides gain.
- Worked example (Chris): a picker gets 10 bunches of berries in 8 hours and would need
  8 hours to make an axe, so pays at most 10 bunches. The smith makes 4 axes in 8 hours (2 h
  each); if the smith picks at the same rate, the least they'd take is 2.5 bunches. Any rate
  from 2.5 to 10 benefits both (gains from trade).
- **Two kinds of norm feed the bargain (Decided):**
  - **Cost norms**, from watching others work: estimate the other side's cost (the range).
  - **Price norms**, from watching trades: where in the range deals land here (the going rate).
- The gap between price norm and cost norm is where premiums, and emergent power, show up.
- Where the rate lands inside the range (split the difference vs. better fallback gets better terms): Open.

### 7.3 Discovery, adoption and loss of know-how (Decided)
- New quality levels are discovered **by chance as a byproduct of tool work**. More hours of
  tool-making → more discoveries (Henrich's collective brain).
- **Discovery is not adoption.** A level spreads only if its supply chain can be built and there
  is demand for it given resources and competing needs.
- **Know-how lives in agents** and is learned **by seeing and doing**: students learn only what
  they can watch being practiced.
- If a resource loss lasts long enough that nobody practices a craft for a generation, the
  know-how is lost and must be rediscovered. Dark ages are possible.

### 7.4 Births (Decided)
- A household decides whether a child is worth the investment, by **ROI**: a few years of
  dependence (care hours, food) against labor contributed until the child leaves to found a
  household, plus old-age care.
- Children are insurance for the household. Chris's hypothesis: this breaks down when labor
  becomes a commodity the individual sells rather than a resource the community spends
  (cf. Caldwell's wealth-flows theory, 1976). Should emerge, not be written in.
- **Population grows** (Decided). The Malthus-vs-hoarding comparison in §1 depends on births
  responding to the ROI rule, not to a fixed rate.

### 7.5 Death and inheritance (Decided)
- **Inheritance is a rule we vary.** Default: holdings return to the **commons**. Variants:
  to trusted peers in proportion to trust; kin-only property (a later technology).

### 7.6 Daily planning, production, consumption
**Open.** Specialization is expected mainly from time and space: needs are spread across the
landscape and the day is limited, so splitting the work saves hours ("you get food, I'll get
water, meet at the shelter at dark").

---

## Open questions (next in the design conversation)
1. Process scheduling: the daily order (§3).
2. Partner search for barter; sensing range (§4.6–4.7).
3. Where a barter rate lands inside the range (§7.2).
4. Daily planning: how an agent allocates its hour budget (§7.6).
5. How many supply-chain stages the foundation needs (§2 Goods).
6. Initialization (§5).
7. Chris disagreed with Claude on "where it could fail" (trickle-down); partly settled — see §4.2.

---

## References
- Caldwell, J. C. (1976). Toward a restatement of demographic transition theory. *Population and Development Review* 2(3–4). (wealth-flows theory)
- Cline, E. H. (2014). *1177 B.C.: The Year Civilization Collapsed.*
- Daw, N. D., Niv, Y., & Dayan, P. (2005). Uncertainty-based competition between prefrontal and dorsolateral striatal systems for behavioral control. *Nature Neuroscience* 8.
- de Waal, F. — reciprocity in chimpanzee grooming and food sharing.
- Emerson, R. M. (1962). Power-dependence relations. *American Sociological Review* 27(1).
- Gesell, S. (1916). *The Natural Economic Order.* (demurrage)
- Graeber, D. (2011). *Debt: The First 5,000 Years.* (citing Humphrey, C. 1985, "Barter and economic disintegration," *Man* 20)
- Grimm, V. et al. (2006; 2020). The ODD protocol for describing agent-based models.
- Henrich, J. (2004). Demography and cultural evolution: how adaptive cultural processes can produce maladaptive losses — the Tasmanian case. *American Antiquity* 69(2), 197–214.
- Henrich, J. (2016). *The Secret of Our Success.*
- Keramati, M., & Gutkin, B. (2014). Homeostatic reinforcement learning for integrating reward collection and physiological stability. *eLife* 3:e04811.
- Laland, K. N. (2004). Social learning strategies. *Learning & Behavior* 32(1).
- Mead, G. H. (1934). *Mind, Self, and Society.*
- Boyd, R., & Richerson, P. J. (1985). *Culture and the Evolutionary Process.* (conformist transmission)
- Vaesen, K. et al. (2016). Population size does not explain past changes in cultural complexity. *PNAS* 113(16).
- Prior economic ABMs surveyed at the start: Dosi, Fagiolo & Roventini (K+S, 2010); Delli Gatti et al. (2011) *Macroeconomics from the Bottom-up*; EURACE; Gualdi et al. (Mark-0, 2015); Gintis (2007); Lengnick (2013); Sterman (Beer Game); Inoue & Todo (2020); Poledna et al. (2023); Godley & Lavoie (2007) stock-flow consistency.

*Citation details are from memory and not yet checked against the sources.*
