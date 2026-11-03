# EvoEco — Model Description (ODD)

*A design bible: amended in place, current truth. History of how decisions were reached goes in
DEVLOG.md. Structure follows the ODD protocol (Grimm et al. 2006; updated 2020).*

**Status:** draft v0.3, 2026-11-02 (v0.1 from the PA session; v0.2 from the EvoEco session the
same day; v0.3 from the audit responses and the first recipe tree). Built from a
question-by-question design conversation between Chris and Claude. Every entry marked **Decided** was Chris's call (some on Claude's proposal);
**Default** means Claude proposed it and Chris did not object; **Open** means not yet discussed.
No model code exists yet; the repo is scaffolded from engine v2 and the build plan is
`DEVPLAN.md`.

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
1. **Currency.** Key property: stores **general purchasing power** without loss. Durable goods
   already store (axes, ore), but only their own use: 100 axes in a village already stocked
   with axes are as good as rocks in the ground, while 100 coins spend on anything (Chris,
   2026-11-01 audit). Grain-money rots and costs storage. Currency allows hoarding of
   purchasing power that was not previously possible. Variant to test: currency with
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
  decides on children together and pools labor (by planning together, §7.6). Membership comes from ties, so households
  form and dissolve as ties do.
- Larger groups (tribes) are **not** entities. They emerge as clusters of strong ties.

### Ties (Decided)
- Primate-level reciprocity: each agent keeps a running, fading tally of what each other agent
  has given it. Willingness to give rises with that tally. Ties that give both ways reinforce
  themselves; ties that stop giving fade.
- **What the tally records (Decided — Chris, 2026-11-01 audit):** the times an agent judges
  that the other made it a **kind offer**. Kindness can come from mutual gain, or from the other
  stepping past their bound (offering better than the agent thinks they needed to), or only
  appearing to: it is judged against the agent's own estimate of the other's costs (§7.2), so
  misestimates can build trust too.
- **Ties form through barter (Decided — Chris).** Trust is one spectrum, weighted by number of
  interactions and by the tally: regular trade → **barter credit** (first deferred gifts, "you
  can get me next time") → trusted tie. First contact is any completed exchange. Barter credit
  stays rough trust, not exact debt (exact accounting is a later technology).
  - **Weight — Default:** how much a trade counts toward the tally, relative to a gift, is a
    swept parameter including 0, so no result rests on our guess.
- **Trust is rough reliability, not an exact ledger.** Exact accounting is a later technology.
- **Owing: the balance of gifts (Decided — Chris, 2026-11-02).** A gift puts the receiver in
  the giver's debt, and an unreturned gift is not erased. Each further unreturned gift worsens
  the balance in the giver's favor, and the giver grows less willing to give. This is where
  the negative side of a tie (grudges) comes from: not a separate count of unkind acts, but
  the zero-sum "owing" of reciprocity.
  - The tally above counts only what was received, so on its own it cannot register being
    owed; the balance is a second quantity per other, beside the kind-offer tally.
  - **The balance counts occasions, not cost (Decided — Chris, 2026-11-02).** It is the number
    of gifts given against gifts returned, not their value in hours. (Replaces a Claude Default
    that valued it in each side's own hours.) Exact, valued debt stays a later technology.
  - **Balances fade, at rates that differ between people (Decided — Chris).** Old unreturned
    gifts are forgotten over time. How: either a per-agent fading rate (some forgive quickly,
    some hold grudges) or random forgiveness events.
    - **Default — both at once:** each unreturned occasion has a small daily chance of being
      forgotten, and that chance is the agent's own. Forgetting is random day to day; how
      forgiving a person is differs between people. The per-agent chance is a heterogeneity
      setting (§2 Agents): uniform in some runs, varied in others.
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
  assemble → distribute; services; waste/recycling. Stages need not be listed: they are the
  depth of the recipe tree, which grows as quality levels are discovered.
- **The recipe tree is hand-crafted (Decided — Chris)** to mirror reality's complexity: real
  goods, real inputs. **Random trees** generated from parameters run beside it as a robustness
  check, so a result cannot be blamed on the one tree we wrote.
- **Reach: up to about the iron age, and narrow to start (Decided — Chris, on Claude's
  proposal).** The model is already complex; the tree starts small and grows. Target: four or
  five quality levels per need (foraging → farming; carried water → pots → wells; lean-to →
  hut → house), tools stone → copper → bronze → iron, recipe depth up to about four.
  Reasons: the later technologies are social, not material, and sit on a pre-industrial tree;
  the scale runs (1×, 10×, 100×) use a productivity multiplier, not deeper tech; and a real
  tree brings its own fragility (bronze needs copper and tin from far apart, so long-distance
  trade and its breakdown come from the tree itself; Cline 2014).

#### First tree, v0 (Decided — Chris, 2026-11-02, on Claude's draft: "a good way to start")
Deliberately small; it grows later.
- **Resources placed:** wild plants, forest, fertile land, water (rivers, springs), flint, clay
  (riverbanks), copper ore, tin ore (far from the copper), iron ore.
- **Intermediates:** wood; charcoal (wood burned in a clay kiln); fired clay; metals (copper;
  bronze = copper + tin; iron bloom = iron ore + much charcoal).
- **Tools are task-specific (Decided — Chris).** Axe (cutting wood, clearing land), hoe/sickle
  (farming), pick (mining, quarrying, digging wells). Each is a head on a wooden haft, in
  stone → copper → bronze → iron. Different trades want different tools, so tool trade can
  emerge from the tree; the cost is three times the tool recipes and norms.

| Level | Food | Water | Shelter |
|---|---|---|---|
| 0 | raw wild plants, by hand | drink at the source | none |
| 1 | cooked wild food (needs wood) | carried in a gourd | lean-to (branches) |
| 2 | farmed grain cooked in a pot (land cleared with axe; hoe, sickle) | carried and stored in a clay pot | hut (poles cut with axe, thatch, hearth) |
| 3 | bread (grain ground on a quern stone, baked in a clay oven) | well near home (dug with a pick, lined) | house (timber cut with a metal axe, clay daub, hearth) |

- **Warmth has levels from two sources (Decided — Chris, 2026-11-02).** Shelter level sets a
  base, and a fire (firewood used up daily) adds to it. A hut without fuel is better than no
  hut; a hut with a fire is better still. So wood is a daily consumable for anyone who wants
  more warmth than the shelter alone gives. Seasons raise the need (cold days).
- Deepest chain (depth check): iron ore + charcoal → bloom → axe head → timber → house, about four.
- **Left out for now:** hunting and hides, herding, cloth, boats.

### Tools (Decided)
- A tool is a **multiplier on production for its task**. Tool quality sets the multiplier.
- Tools wear out and must be repaired or replaced.
- Tools are made from resources and with other tools: the loop that later becomes capital.
  Tool-making is central to the economy.

### Landscape and resources (Decided)
- **Physical space.** Location, distance and placed resources are part of the model.
- **A stranger is anyone without a tie, near or far (Chris, 2026-11-02; replaces "strangers
  are, roughly, the far away").** Meeting does not make a tie; exchanges do. So barter happens
  inside a band too, between bandmates who are not trusted ties. Distance only makes
  strangers more likely, since there are fewer exchanges with the far away.
- **Open access in the foundation (Decided — Chris, 2026-11-01 audit).** Property in land and
  resources is a separate technology-ladder entry, so it is never confounded with capital.
- Three resource classes, modeled on reality:
  - **Non-renewables:** finite deposits that must be found and mined (ore, stone).
  - **Renewables:** stocks with their own regrowth rate that can be overused (fields, game, fish, forest).
  - **Water:** its own cycle (rain and season → rivers, springs; flow varies by place and time).
- **Implementation — Default:** one resource mechanism with parameters (starting stock,
  regrowth rate, inflow), so all three classes are the same code with different numbers.
  Start with one instance of each.
- **Maps are generated (Decided — Chris, 2026-11-02).** Parameters set how clustered each
  resource is and how far apart key pairs sit (copper and tin); each seed gives a different
  map, so no result rests on one map, and the parameters are dials (tin near vs far). **Some
  experiments fix one map** (Chris), held constant across runs.
- **The map is a hex grid (Decided — Chris, 2026-11-02),** over Claude's proposal of a network
  of places. Each hex has terrain and resources.
  - **Hex size: about an hour's walk across (Decided — Chris, 2026-11-02, on Claude's
    proposal),** about 4–5 km: roughly a place a forager would name (a spring, a stretch of
    forest). A day's reach is about four or five hexes out and back. (Chris first proposed 30
    minutes for more resource locations near shelters, then chose the hour.)
  - **What "place" means on the grid — Default:** a place is one hex. Meeting is being in the
    same hex on the same day (§3); norms are per activity per hex (§4.4); travel time is the
    hex path's length weighted by terrain.
  - **Route search — Default:** the planner (§7.6) considers as stops only hexes with something
    useful in them (resources, shelters, places where trades have happened), and charges travel
    between them by hex path. That keeps search near the cost of a network of places.

### Scales (Decided)
- **One tick = one day.** Each agent has an **hour budget** for the day, spent on travel, work,
  care and rest. Hours are a budget, not simulated steps.
- **Seasons:** a year of days, so harvests vary and stores matter.
- **Runs span generations** (~9,000 days each). Rough cost estimate: a few million agent-days
  per generation for a few hundred agents — fine on one machine if daily planning stays simple.

---

## 3. Process overview and scheduling

**Synchronized phases (Decided).** All agents pass through each phase of the day before any
agent enters the next; no agent lives its whole day ahead of another. The model has no clock
inside the day, so:
- **Meeting is co-location:** two agents meet if they spent part of the same day at the same place.
- **Contested resources** (a field, a spring) are drawn from in a random order, reshuffled daily.

**Phase order (Decided — Chris, after review):**
1. **Plan:** routes for the day (§7.6); households plan together.
2. **Travel and work:** walk the route, gather or make, wear tools; care comes out of rest
   hours; chat with up to k of the people met (§4.6).
3. **Exchange, at each place:** gifts to ties in need, strongest ties first (household
   members are the strongest), then barter among the rest, scarcest first (§4.7).
4. **Consume:** meet needs from holdings; store the rest (perishables decay).
5. **Learn:** habits from own day; norms from own day plus chat.
6. **Aging, births and deaths.**

Work comes before exchange, so goods gathered today can be traded today. Household pooling is
not a separate step: it is gifting to those in need within the household (Chris). What sets a
household apart is that it plans together (§7.6).

Known cost: "same place, same day" is coarse; it ignores whether two agents were there at the same hour.

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
- households and tribes (clusters of ties); power (asymmetric dependence); intimacy.
  Exception, stated: the household is a **formal unit by rule** (§2); only its membership
  emerges (audit, Chris agreed)
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
  water source), by seeing and by chat with the people met, capped at k a day (§4.6). What can
  be learned depends on where you are and whom you meet.
- Expected consequence: norms carry survivorship bias (you only see those who return).
- **Curiosity term — Default:** a small bonus for uncertain options (the epistemic term of active inference, cheapest form).
- **Particular others — option:** separate models of specific agents, perhaps only for tied
  agents. Norms are the "generalized other" (Mead 1934).

### 4.5 Prediction
- **Quality is valued (Decided — Chris, 2026-11-01 audit).** Agents want higher quality for
  intrinsic and instrumental reasons: better food restores more of the need per unit; better
  tools produce more and last longer. Agents adopt a new quality level when they expect its
  benefit in need terms (not hours alone) to exceed the cost of switching. (Replaces a Claude
  Default that counted only hours saved.)
- Child-bearing is an ROI decision (§7.4).

### 4.6 Sensing
- **You learn from the people you meet (Decided — Chris).** Agents who meet during the day
  (co-location, §3) chat and share their details: where they went, how long, what they got,
  what they traded and at what rate. Each agent updates its norms from these reports and from
  what it saw itself. Returners at a shared shelter are one case of this.
- Consequences: information travels along the meeting network; places where many meet
  (shelters, emerging markets) become information hubs. Chat transfers facts about days, not
  know-how: crafts are still learned only by watching them done (§7.3).
- **Details — Default:**
  - Reports are first-hand only (each agent's own day); no passing on what you heard.
  - Reports are honest; others' reports carry noise, your own experience is exact. That noise
    is one source of the differing cost estimates in §7.2.
  - Chat costs no hours (as observation, §4.4).
- **Chat is capped (Decided — Chris):** unlimited chat would swamp processing (60 agents at a
  market is 3,600 exchanges of news per place per day). **Default:** each agent chats with at
  most k agents a day (k ≈ 5), ties present first, then others at random. Cost at k = 5: a few
  hundred agents × 5 × 9,000 days ≈ 10⁷ report updates per generation. Expected consequence of
  ties-first: news circulates within clusters faster than between them, so cost knowledge
  is most uneven between groups.

### 4.7 Interaction
- **Reciprocity** between tied agents; **barter** between strangers (§7.1–7.2).
- Partner search: strangers can barter only if they met (co-location, §3). No separate search
  rule is needed to bring them together: the route planner values trade by how reliably it has
  happened at each place (§7.6), so agents with goods to trade route through those places.
  Markets as places can emerge this way. Who trades with whom at one place: scarcest first (below).
  - **Rejected — one side picks its best partner** (Claude's proposal; Chris's objection): the
    two sides would pick different best partners, and letting one side pick forces the other into
    its worst acceptable deal. Whoever picks first gains, so random turn order would decide
    outcomes. This is a classic matching result: in deferred acceptance the proposing side gets
    its best stable partner and the receiving side its worst (Gale & Shapley 1962).
  - **Under discussion:** (a) *mutual best* (Claude): pair agents who are each other's first
    choice, repeat; random acceptable pair when preferences loop. (b) *short side picks*
    (Chris): whichever side is scarcer at the place (buyers' or sellers' market) gets the
    picking power. Claude's note: (a) gives the short side picking power without a rule saying
    so (one smith among five buyers is everyone's first choice and pairs with the buyer it likes
    best; one buyer among five smiths pairs with the cheapest). (b) writes into a rule
    the power-from-alternatives that §4.2 says must emerge, and needs buyer and seller roles,
    which barter does not have (each trader is both).
  - **Chris's challenge: how often does mutual best resolve a round?** Toy test (Claude,
    2026-11-01; agents with one surplus good each, need-based double coincidence, the bid
    rule's split modeled as 0.5 ± noise for differing cost estimates). Share of pairings found
    by mutual best rather than the fallback:

    | market (agents, goods) | equal estimates | noise 0.1 | noise 0.25 | random preferences |
    |---|---|---|---|---|
    | 5, 3 | 100% | 98% | 89% | 64% |
    | 20, 4 | 100% | 80% | 46% | 34% |
    | 60, 5 | 100% | 48% | 18% | 15% |

    With equal estimates the two shares are equal, so the pair with the largest joint gain is
    always mutual. Once estimates differ (§7.2, which Chris showed is the general case), the
    fallback decides most pairings in a crowded market. The fallback is one side picking, the
    rule already rejected. The exact numbers depend on the toy; the direction (worse with more
    agents and with more disagreement) is the finding. **Mutual best alone is not enough.**
  - **Matching: scarcest first (Decided — Chris's mechanism).** At a site, trades are processed
    in order of scarcity, from the scarcest good to the most abundant. Holders of the scarcest
    good pick partners first, by their own expected gain; the picked agent accepts if the
    walk-away guard passes. This is the sellers'/buyers' market idea stated per good, so it
    works in barter, where every trader is both buyer and seller, and reduces to buyers and
    sellers once currency exists. The rule says scarcity confers the choice; who is scarce
    still emerges (location, specialization, luck).
    - **Rounds per good (Decided — Chris, correcting a Claude Default):** the scarcest good's
      round goes first and clears all trades for that good; then the next good's round, and so
      on. An agent with many goods takes part in each good's round. More goods is more
      opportunity, which is a fact about the agent, not a bias of the rule.
    - **Scarcity — Default:** for each good at the site, quantity wanted by agents present
      ÷ quantity held there, computed once at the start of the exchange phase.
    - **Ties — Default:** holders of equally scarce goods go in random order, reshuffled daily.
      Option if order among equals matters: let them all offer at once and each target accept
      its best offer (deferred acceptance within the tier).

### 4.8 Stochasticity
- Discovery of new quality levels is stochastic (§7.3). Resource yields vary by season.
- Random orders, reshuffled daily: draws on contested resources (§3), ties among equally
  scarce holders in matching (§4.7), who plans first in a household (§7.6), and whom an
  agent chats with beyond its ties (§4.6). Noise on others' reports (§4.6). Others: Open.

### 4.9 Collectives
- Households (light formal unit); tribes as emergent tie clusters.

### 4.10 Observation (what we measure)
- Per category, the 10th, 50th, 90th and 99th percentiles of quality consumed, over time.
- Rest (hours free per day), belonging (tie measures), both as distributions.
- Comparison is against the matched run without the technology. **How runs are compared is
  deferred (Chris, 2026-11-02):** a research question for later, not a design decision now.
  The earlier "at the same total output" is withdrawn (audit item 2).
  - Chris's stance: the free-market case for capital is hogwash. His claim is that extraction
    hurts the economy; the counter is "we don't extract it all, and that is good." If the
    free-market case were correct, extraction would be zero, which it demonstrably is not.
    The dogma is answered in the paper with the model's evidence, not in the model's design.
- Productivity scaling runs (1×, 10×, 100×) for the "no matter the scale" claim.
- Further output measures: Open.

---

## 5. Initialization

**Blank start at zero (Decided — Chris).** Agents are placed on the landscape with the lowest
quality level of know-how, no ties, no households, and near-empty norms. Households, tribes,
trade places and price norms must all form.
- **Starting know-how: stone and fire (Decided — Chris, 2026-11-02).** Agents start knowing
  fire and the stone tools (axe, hoe/sickle, pick), as Homo sapiens had both long before any
  economy.
- **Starting layout: bands (Decided — Chris, 2026-11-02, on Claude's proposal).** Several
  bands (say 5–8 of 20–40 agents) start a day or two's walk apart. No ties or households are
  pre-built; only nearness is given.
  - **Expected, not written in (Chris):** a few households form in each band, each with its
    own shared shelter. Bonds run closest in the household, then the band, then strangers.
    Bandmates may or may not be trusted ties. One can be a tie without being trusted (the
    early end of the trust spectrum, §2 Ties). Where gifts are given and not all can be
    returned, grudges arise; some agents end up in no trusted pair but still barter.
- **Starting know-how, continued — Default:** level 1 of each ladder is known too (cooked wild food, gourds, lean-tos), as
    stone-and-fire foragers had them. Level 2 on (farming, pottery, huts, metals) must be
    discovered by tinkering.

**Scaffolding (Decided — Chris; rules Default).** Some scaffolding may be needed to get the
first economy going (candidates: starter stores so nobody starves before learning anything;
agents starting in small groups near water so meetings repeat). Rules for any scaffold:
- used only during burn-in, and removed before anything is measured;
- listed here, each one;
- never one of the things in the emergent ledger (§4.2): no prebuilt ties, households or prices.

**Burn-in (Decided — Chris).** The foundation runs alone until the §1 patterns settle. If they
never settle, the foundation has failed.
- If burn-in is **short and reliable**, every experiment reruns it from zero.
- Otherwise, **matched runs fork from a saved snapshot** of a settled world: with and without
  the technology, same agents, landscape and random draws from the fork on (Claude's proposal).
- **Reliability check — Default:** run several independent burn-ins and compare the
  foundations they reach. If they differ a lot, use several snapshots, not one, so a result
  does not rest on one history.

## 6. Input data

None planned (existence proof, no calibration). **Open** for later stylized-fact checks.

---

## 7. Submodels

### 7.1 Reciprocity (Decided, Default details)
An agent short on something asks tied agents nearby. A tied agent gives if it has surplus
beyond its own buffer, with willingness scaled by the tie tally. Trust rises in both
directions when gifts come back and fades when they don't.
- **No price between ties (Decided — Chris).** Ties are trusted reciprocal swappers. If a
  trusted tie needs a resource I have, I give it; there is no bargaining window. A couple who
  gather complementary resources and meet each other's needs every day or so will bond
  tightly and become each other's regular partners.
- **Order in the exchange phase — Default (follows from the above):** gifts to ties in need
  happen first; barter among the rest, scarcest first (§4.7), comes after.

### 7.2 Barter and price (Decided)
- Each agent values a good by its estimate of the hours it would cost to get it itself,
  adjusted by need (homeostatic state). A trade happens when both sides gain.
- Worked example (Chris): a picker gets 10 bunches of berries in 8 hours and would need
  8 hours to make an axe, so pays at most 10 bunches. The smith makes 4 axes in 8 hours (2 h
  each); if the smith picks at the same rate, the least they'd take is 2.5 bunches. Any rate
  from 2.5 to 10 benefits both (gains from trade).
- **What a barter price is (Decided — Chris's question, Claude's answer):** an **exchange
  ratio** between two goods (bunches per axe). Each side values both goods in its own hours,
  and its hours convert to the ratio: the picker's limit is axe-hours ÷ hours per bunch =
  8 ÷ 0.8 = 10 bunches. Hours are not comparable across agents (a picker's hour and a smith's
  hour yield different things), so the ratio, not hours, is what the two sides agree on.
- **Middles are geometric (Decided — Chris confirmed).** An arithmetic middle depends on which way the ratio
  is quoted: bunches per axe gives 6.25, axes per bunch gives 1/0.25 = 4. The geometric mean
  (√(2.5 × 10) = 5) is the same either way. So the fair bid and the midpoint of two bids are
  geometric means.
- **Price norms are per pair of goods.** With n goods there are n(n−1)/2 going rates, and
  nothing forces them to agree (berries→fish→axe need not match berries→axe). An agent may
  have seen no trade of the pair it wants. This is barter's own cost, and what currency later
  fixes as a unit of account, a benefit of currency separate from its storability.
- **Two kinds of norm feed the bargain (Decided):**
  - **Cost norms**, from watching others work: estimate the other side's cost (the range).
  - **Price norms**, from watching trades: where in the range deals land here (the going rate).
- The gap between price norm and cost norm is where premiums show up. Whether a premium
  reflects power or only a knowledge gap or need is decomposed below ("Measurement").
- **Where the rate lands (Decided — Chris's mechanism):**
  1. Each side knows its own cost and estimates the other's from the particular other (a
     model of that agent) or the generalized other (cost norms). If a gap exists, the
     **fair bid** is its (geometric) middle.
  2. Each side compares the fair bid with the **going rate** (price norm) and bids whichever
     gives it the larger gain.
  3. The deal lands at the **midpoint of the two bids**. Both bid the going rate → the going
     rate. Both haggle → split the difference.
  - **Walk-away guard — Default:** each side accepts only if the midpoint still leaves it a
    gain by its own cost. Without it, a seller bidding a going rate above the buyer's limit
    could pull the midpoint past that limit.
  - **Expected consequence (corrected after Chris's challenge: the two sides need not estimate
    costs alike; Chris confirmed this picture fits).** Each side has its own fair middle (buyer Mb, seller Ms).
    - If Mb > Ms (the buyer thinks the fair price is higher than the seller does), any going
      rate between them is **stable**: both bid it. A going rate outside the band is pulled to
      its nearer edge. Convention picks the price inside the band; history matters there.
      Example: buyer limit 10, true smith cost 2.5; buyer guesses smith cost 4 (Mb = √40 ≈
      6.32), smith guesses buyer limit 8 (Ms = √20 ≈ 4.47). A going rate of 6 holds; 8 is
      pulled down to 6.32.
    - If Mb < Ms, the price goes to the midpoint of the two fair bids and the going rate drops out.
    - Only when both estimate alike does every trade pull the price to a single fair point.
    - So the room for a conventional premium is the gap in cost knowledge. That gap should
      grow where agents don't watch each other's work: strangers, the far away, and crafts that
      specialization makes opaque.
    - Other sources of a persistent premium: need shifting one side's limit; one side lacking
      alternatives (partner search, §4.7).
    - **Measurement:** the model knows true costs, so log each agent's estimate error. A premium
      can then be split into knowledge gap, need and lack of alternatives rather than read as power outright.

### 7.3 Discovery, adoption and loss of know-how (Decided)
- ~~New quality levels are discovered by chance as a byproduct of tool work.~~ Replaced
  2026-11-02: **discovery comes through tinkering** (below). Chris: chance discovery would need
  working with the right ingredients, the same preconditions as tinkering. Henrich's collective
  brain survives in that whoever holds the inputs most (smiths hold ore and charcoal) tinkers
  with them most.
  - Consequence (Claude): the two differ in hours. A byproduct costs no time; tinkering takes
    hours from work and rest, so discovery needs either necessity (nothing better to do) or
    slack (needs met). Scarcity that removes slack would slow discovery; this emerges from the
    planner, not from a rule, but it bears on the results and should be logged.
- **Exploration and discovery are activities an agent can choose (Decided — Chris,
  2026-11-02).** Two kinds: scouting (finding places and resources; non-renewables must be
  found) and tinkering (trying for a new level). Chris: chosen mostly when no option is
  favorable (barren surroundings), or when all needs, rest included, are met.
  - **How the planner picks them — Default:** no rule names those two situations. The route
    planner (§7.6) scores exploring with the curiosity term (§4.4) like any other activity.
    Because need costs are convex, a met need is worth little more, so in either situation
    the curiosity term is what's left to win. Chris's two cases then come out of the planner.
  - Tinkering works with what the agent has on hand, so the chance of finding a level depends
    on holding its inputs.
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
- **Population size is endogenous** (Decided; reworded from "population grows" after the
  audit, which read it as an imposed outcome). The Malthus-vs-hoarding comparison in §1 depends on births
  responding to the ROI rule, not to a fixed rate.

### 7.5 Death and inheritance (Decided)
- **Foundation: everything stays where it lies (Decided — Chris, 2026-11-02).** A dead
  agent's holdings stay at the place they are, under open access: whoever finds them may use
  them. Anything beyond that is a **tradition**. So goods stored at a household's shelter
  pass to the people who live there by location, not by a rule naming heirs.
- **Inheritance traditions belong on the technology ladder (Chris, 2026-11-01 audit).**
  Candidates: return to the commons; to trusted peers in proportion to trust; kin-only
  property. (The audit flagged that commons-by-default equalizes by rule and that a
  free-market reader rejects losing bequest; where-it-lies does neither.)

### 7.6 Daily planning, production, consumption
**Route planning (Decided — Chris's mechanism).** Each day an agent chooses the route (a sequence
of places and what to do at each) that gives the most return on its homeostatic needs for the
least cost: a shortest path for energy minimizing.
- **Learn per activity, plan per route (Default).** The habit and norm tables hold values for
  single activities at single places (hours spent, load returned). The planner combines them
  into routes, charging travel between stops. Learning stays cheap; planning sees combinations.
- Because need costs are convex, the second unit of the same good is worth less than the first,
  so routes spread across needs without a rule saying so.
- This is policy selection in the active-inference sense: whole sequences of actions are scored, not single steps.
- **Compute — Default:** search only places within a day's reach, with a small cap on stops.
  Habit as a cached plan: reuse yesterday's route unless conditions changed. Cost estimate: a few
  hundred agents × 9,000 days × a few thousand candidate routes is ~10¹⁰ route evaluations per
  generation if searched exhaustively every day, so caching or pruning is needed.
- **Horizon: one day (Decided).** Long-term thinking is approximated inside the daily plan's
  valuation, not by planning across days.
  - **Long-term planning is needed after all (Chris, 2026-11-01 audit):** child ROI (§7.4) and
    investment in tools need a horizon longer than a day. Mechanism: settled below (Keep plus
    partial-project value).
  - Chris (2026-11-02): the means may already exist. Claude's read: the Keep value below is
    that means for goods held at dark (an axe is worth the hours it saves over its life), so a
    one-day plan already chooses to invest. Child ROI has its own rule (§7.4). Gaps: work
    unfinished at dark (a multi-day build), and how steeply the future is discounted.
  - **Partial projects carry partial value (Decided — Chris, 2026-11-02).** Work unfinished
    at dark is worth the finished good's value, less the work still left, discounted by the
    risk of not finishing. All three come from learned norms. So a one-day plan can start a
    multi-day build.
  - **Discount on the future — Default:** a swept parameter, not one fixed value. It sets how
    strongly agents invest and hold, so it carries audit item 4 (motive to accumulate).
- **Trade enters the plan (Decided).** A good the agent does not need itself still has value if a
  reliable trade for some other need is expected. Chris: a second basket of berries makes sense
  if a trade is waiting at the end of the day.
- **End-of-day holdings: best of three uses (Decided, on Claude's proposal).** Each good held
  at dark is worth the most it could do of:
  1. **Keep:** the future need it covers, discounted by how it stores (berries rot, axes
     don't). Expected future need comes from seasonal norms. Currency plugs in here later.
  2. **Trade:** what it fetches at the going rate (price norms) in a needed good, scaled by how
     reliably that trade has happened at places on the route. Reliability is learned.
  3. **Give:** to a tied agent. Chris: the gift is a **trade for belonging**. It pays in the
     belonging need now (convex, so an agent short on belonging values giving more) and in
     likelier help later.
  All three values come from learned norms; none is set by rule.

- **Households plan together (Decided — Chris).** This is how they pool labor: the plan
  can split the work so that the swap at home benefits both.
  - **Mechanism — Default:** sequential best response. One member plans; the next plans
    knowing that route; order random each day. Cost: about one individual plan per member,
    where a truly joint search would multiply the route spaces (thousands × thousands).
  - **Ties outside the household (Decided — Chris):** an agent anticipates a tie's route
    from its model of that particular other (yesterday's habit), and values gifts to that tie
    accordingly. The difference between household and tie is information: a household shares
    today's plan, a tie is predicted from the past.
  - Chris's summary: planning is **noisy pathfinding**, a shortest path through a world partly
    known (norms, chat) and partly predicted (ties' habits).

Specialization is expected mainly from time and space: needs are spread across the
landscape and the day is limited, so splitting the work saves hours ("you get food, I'll get
water, meet at the shelter at dark").

---

## Open questions (next in the design conversation)
1. Further output measures (§4.10).
2. Chris disagreed with Claude on "where it could fail" (trickle-down); partly settled — see §4.2.

### Cold ledger audit, 2026-11-01 (fresh agent, ODD only; findings checked against the text by Claude)
Status after Chris's responses the same day:
1. Ties cannot form; trade never builds belonging → **resolved** (§2 Ties: kind-offer tally, trust spectrum through barter).
2. "At the same total output" (§4.10) removes the reinvestment channel → **deferred**: wording
   withdrawn; how runs are compared is a later research question (Chris, 2026-11-02).
3. Quality measured but not valued → **resolved** (§4.5: quality valued intrinsically and instrumentally).
4. Satiable needs give no motive to accumulate → **resolved with 8**. Chris: insatiable needs
   would write in extraction. Accumulation comes from investment (store or build now, rest
   later) through Keep and partial-project value; its strength is the swept discount (§7.6).
5. Tree ceiling at iron (§2 Reach) → **deferred** (future problem).
6. Scarcest-first gives multi-good agents first pick → **resolved** (§4.7: rounds per good, Chris's intended mechanism).
7. Inheritance to the commons by default → **resolved** (§7.5): the foundation leaves holdings
   where they lie; every other regime is a tradition on the ladder (Chris, 2026-11-02).
8. One-day horizon vs long-horizon decisions → **resolved** (§7.6): Keep values goods over
   their life; partial projects carry partial value (Chris, 2026-11-02); discount swept.
9. "Population grows" → **resolved** (reworded: endogenous).
10. Open-access land → **resolved** (§2: open access in the foundation; land rights a ladder entry).
11. Household as formal unit → **resolved** (stated in §4.2).
12. Currency's difference from durable goods → **resolved** (§1: general purchasing power).

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
