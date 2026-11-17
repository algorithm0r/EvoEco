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
    - *Care in old age — Default (Claude, 2026-11-05):* no separate care need. An old agent
      who cannot work enough is an agent in need, and is kept by gifts from its ties, weighted
      by how much of each giver's belonging it supplies (§2 Ties); its grown children are
      usually its deepest ties. Old agents may tend children, so a grandmother pattern can
      come out of the planner, not a rule.
  - **Care is labor drawn from rest:** it produces no goods, costs the carer's hours, and flows through ties.
  - **Three stages of a child's life (Decided — Chris, 2026-11-04):** "a child can work on
    tasks the mother is doing while she's caring for the child after an age. perhaps after a
    certain age the child can be tended by any adult. then once mature they work on their own."
    1. *Infant:* nursing, with its mother (§2 sexes).
    2. *Child:* goes with a carer and works at the carer's task, at a child's rate, while the
       carer cares for it. At first the carer is the mother; past a set age any adult may tend
       it. The child does not plan its own day. It sees what its carer practises, so know-how
       passes this way (§7.3).
    3. *Mature:* plans and works on its own.
    Chris: "i very much intended that benefit. that is the core mechanism of social learning":
    a child learning by seeing what its carer practises.
  - **Ages (Decided — Chris, 2026-11-04):** "maybe 6 is when we can expect actual
    productivity and not just learning. i was thinking more like 10 for when the child can
    apprentice out." So: nursing to about 2; with the mother, learning but not producing, to
    6; working at a child's rate with the mother from 6; tended by another adult possible
    from 10 (apprenticing out); mature at about 15 (Default). Numbers are `PARAMETERS`.
  - **The mother passes the child on (Decided — Chris, 2026-11-04):** "your mechanism for care
    ... will end with a positive feedback on the mother. i think we need a way for the child
    to be passed off by the mother. i kind of weaning. but i think the folks she would trust
    with her child are her closest ties. so the care of the child could work as a kind of
    offer, but maybe an offer to the mother instead of the child?" (Replaces Claude's
    proposal that the child choose among willing adults by its own ties, which would keep the
    child with its mother for good.)
    - *Mechanism — Default (Claude, 2026-11-04):* from 10, each morning the mother may hand
      the child to a willing adult. She picks the one she trusts most among those willing.
      An adult is willing when its plan values the day with the child (the child's help at
      its task, and the belonging a kind offer to the mother brings, §7.6 Give) above the
      care hours. Tending her child counts as a kind offer to the mother: it adds to her
      tally of the carer and to what she owes the carer (§2 Ties), so alloparenting runs on
      reciprocity among close ties.
  - **A child builds its own ties through the normal channels (Decided — Chris, 2026-11-04):**
    "yes, through normal channels." Care and gifts received count as kindness in the child's
    own tally, from whoever gives them.
  - **Others treat a child as an extension of its mother (Decided — Chris, 2026-11-04):**
    "i kind of want the peers to treat teh child as an extension of the mother. so those who
    might gift to the mother might also gift to her child in need. (using the mothers trust as
    the childs) but the gift might need to work as the mothers to child and not incur a grudge
    still."
    - *As to build — Default (Claude, 2026-11-04):* until it matures, whether someone gives
      to a child in need is judged by the giver's tie to the mother (trust, and her owing
      balance with the giver), not to the child. The gift never enters an owing balance with
      the child, so no grudge against a child. It counts as a kind offer to the mother (her
      tally of the giver and what she owes rise, as with tending), and as kindness received in
      the child's own tally.
  - **When the mother dies (Decided — Chris, 2026-11-04, on Claude's proposal):** "yes, the
    child should pass to a trusted tie and yes to nursing. in the case of a non-tied mother
    without a generous samaratin the child probably perishes or survives on their own if old
    enough."
    - Her place (whose trust stands for the child's, who hands it on, whose account its
      gifts go on) passes to the adult the child is most strongly tied to, if that adult is
      willing.
    - A nursing infant lives only if a woman nursing her own child takes it on, by the same
      willingness rule.
    - With no one willing, nothing written kills the child: it lives on what it is given.
      *Default (Claude):* from 6, when a child can produce, an untended child plans its own
      day at a child's work rate; younger, it lives only on gifts, and dies of hunger without
      them.
  - **Two sexes (Decided — Chris, 2026-11-04):** "i think we kind of need sexes. division of
    labor did branch in this way for humans. and it opens another dimension of human resource
    trade between groups which was also relevant." A child needs a female and a male. Neither
    a division of labor by sex nor the movement of partners between bands is written in: the
    ledger (§4.2) holds them as results.
  - **The sexes differ only in reproduction (Decided — Chris, 2026-11-04, on Claude's
    proposal):** pregnancy (about nine months, more food needed and fewer working hours late in
    it) and nursing (the infant lives on its mother's milk for about two years, which costs her
    food and ties the infant to her: she carries it or comes back to it). No difference in
    strength, speed or skill; a strength difference may come later as a robustness setting,
    like talent. Rationale: Brown (1970, unchecked) argued the division of labor by sex follows
    from which work fits with infant care (near home, interruptible, safe); written this way,
    any division of labor that appears grew from those constraints through the planner.
    Numbers are `PARAMETERS`. Claude's caution, recorded: in bands of 20 an uneven sex ratio
    can stop births for reasons unrelated to the economy, which makes partners from other
    bands matter.

### Households (Decided)
- ~~A **light formal unit**: a pair with a strong mutual tie forms a household, shares shelter,
  decides on children together and pools labor (by planning together, §7.6). Membership comes from ties, so households
  form and dissolve as ties do.~~ (Superseded 2026-11-04 by the entries below: an emergent,
  loose coalition of any size, defined by planning together.)
- **Households can be anyone (Decided — Chris, 2026-11-04):** "households can be anyone.
  family structure then becomes a result." No condition of sex on who forms a household; a
  child still needs a female and a male (§2 Agents).
- **Households are loose coalitions, larger than pairs (Decided — Chris, 2026-11-04):** "i
  think households should be larger than pairs. pairs will have kids that will be part of the
  household. those kids might make new households, but htey might carry on that household.
  and over time we would expect a household to maybe consist of multi gens. ... households
  should be like loose coalitions that are held together by convenience and custom."
  Children are born into a household and may stay or leave; households spanning generations
  are possible, not written in. This replaces "a pair with a strong mutual tie" above.
- **What matters is planning together, among strong ties (Decided — Chris, 2026-11-04):**
  "the only part that seems important is the planning together. my guess is that all folks
  with strong ties will roughly plan together. not low level maybe but high level. like 'i'll
  get food, you get wood, and you get water' then they all return from their own planned days
  and swap. then a planning group might extend to the whole band if the band is tightly
  bound." Sharing a roof is not what defines it (a Claude proposal to define the household
  as a dwelling's sleepers was set aside).
- **Households are emergent, not a formal unit (Decided — Chris, 2026-11-04):** "until we
  need a more formal household let's go with emergent ones." There is no household entity: a
  household is a cluster seen in who plans around whom, like a tribe. Planning together is
  graded by trust in ties (§7.6). Replaces the "light formal unit" above and its exception
  in §4.2; a formal household may return later, on the ladder or when a rule needs one.
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
- **Levels of trust are descriptive, with no discrete boundaries (Decided — Chris,
  2026-11-05):** "if you think you can make this work mathematically i agree. i want no
  discrete boundaries if we can make that work. ... at the highest trust the block will just
  not trigger and we can make 'family' descriptive, not a part of the model." Chris's
  brainstorm: two axes, how well known (familiarity) and the balance of good done each way
  (valence); stranger, grudge, neutral, tie, trusted and family are names for regions of one
  continuous record, used in measures and talk, never states with rules of their own. Close
  to Sahlins' (1972, unchecked) spectrum of generalized, balanced and negative reciprocity,
  except that here history, not kin distance, places a person on it.
  - **The goals (Decided — Chris, 2026-11-05):** "1) have mothers (and maybe fathers) bond to
    children at the highest level and 2) have elder parent not cut-off because of grudges."
  - *Mechanism — Default (Claude, 2026-11-05):*
    1. *Familiarity slows forgetting.* A tie's memory grows with the number of dealings in it
       (the "weighted by number of interactions" of the entry above, unbuilt until now): a
       few trades fade in about two months, fifteen years of daily care and help over
       decades. Without this the childhood bond is gone within a year of the child leaving.
    2. *Tolerance of owing grows with trust.* The unreturned gifts a giver carries before a
       grudge rise smoothly with its kindness received from the other: about 3 for a new tie,
       as now; never reached for a parent. "Family" is that region, not a rule.
    3. *The bond builds through the normal channels.* Care received counts as kindness in the
       child's tally (above); a child's help at its carer's task counts as a kind offer to the
       carer. Both directions are high by maturity; a father bonds as far as he deals.
  - ~~**Open (2026-11-05): belonging saturates.**~~ (Resolved below.) A gift paid the giver
    only through the belonging it adds, and belonging is capped (5 units meet the need), so a
    grown child whose belonging was already full gained nothing by giving to a parent in need
    and would not give: cut off by saturation, not by a grudge.
  - **A tie's need weighs in the giver's own cost (Decided — Chris, 2026-11-05, on Claude's
    proposal):** "yes i think so. i don't like that giving is purely instrumental. i think we
    are trying to build a ladder from instrumental to intrinsic." The ladder: barter is
    instrumental (mutual gain), the belonging a gift brings is reciprocal, and care weighted
    by the tie is intrinsic. Each rung grows out of the one below through history, not kin.
    - *As to build — Default (Claude, 2026-11-05):* when i weighs a gift to j, its cost counts
      the drop in j's cost the gift brings, times i's weight on j: the share of i's belonging
      that the tie to j supplies, (smaller of kindness received and given) ÷ (the larger of i's
      total over all ties and the 5 that meet the need). The weight is at most 1, so no one
      values another above themselves. A weak tie barely registers; a deep tie in need weighs
      almost like one's own need. The grudge and the belonging gain stay as they are.
    - *Consequence, recorded:* the weight uses the smaller of the two directions, so a
      mother's intrinsic weight on her infant is zero until the child gives (help from 6).
      Infant care rests on her valuation of the child (§7.4); intrinsic care grows over
      the child's life. The ladder runs within one bond too.
    - **No bond written in at birth, for now (Decided — Chris, 2026-11-05):** "let's see how
      it goes." Asked whether infant care should rest on the mother's valuation until the
      child gives back, or start from a bond at birth (a §4.2 exception). Watch for mothers
      dropping infants once built.
  - *As built, Stage 6 — Default (Claude, 2026-11-06; `agent.js`, `exchange.js`):* a tie
    fades with memory `tallyMemory` × (1 + dealings ÷ 40): 3 trades fade in about 64 days,
    5,000 dealings (fifteen years of daily care) in about 21 years. The grudge limit is
    `owedLimit` × (1 + kindness received ÷ 5). Grudges stop gifts and drop the other from
    the barter shortlist, as before. The weight on a tie's need is the formula above: the
    giver counts the drop in the receiver's own cost (the receiver's evening and projection)
    times its weight.
    - *Result, bands, seed 1, one year, no births:* familiarity and tolerance alone change
      little (89/100 alive against 87; gifts 2,827 against 2,268). The weight on a tie's
      need roughly triples gifts (6,973) and moves the deaths: none until day 330, then 24
      in the last month of winter (76/100 alive), where without it 11 die early in winter.
      Every variant is short of food by midwinter (mean food 0.25–0.30), so sharing spreads
      a common shortage across ties until stores are gone. A receiver near death tonight
      weighs heavily (the lethal-night cost, a flagged Default), so ties pour food into it.
  - **Who is given to first: where the gift pays most (Decided — Chris, 2026-11-15:** "if this
    means give to the person with the most need (equally tied) then yes"**).** Of all those
    short of a good at a place, the gift that pays its giver most goes first (her weight on
    the receiver × the receiver's gain, less her own cost), then the next, until no gift pays.
    Between people she is tied to equally, her cost is the same, so the needier one (the
    larger gain: the one nearer death, in a child's case) is fed first; a closer tie can
    outweigh a greater need. (Until 2026-11-15 receivers were taken in the order agents are
    stored, oldest-born first. In an exp002 colony a mother of three holding one unit of greens
    gave it to her 8-year-old at food −4.1 while two of hers at −5.8 got nothing.)
    - *As built — Default (Claude, 2026-11-15):* each receiver's gift is chosen as before
      (givers by weight on it, then trust; the first whose gift pays gives, the whole shortfall
      or else a day's food); the receivers are then served largest pay first, and after each
      gift the receivers whose giver just gave are weighed again.
- **Power is not a primitive.** It emerges as asymmetric dependence (Emerson 1962): the agent
  many need and who needs few. Intimacy likewise emerges, as tie strength from frequent mutual giving.

### Needs (Decided)
Homeostatic set points:
- **Food, water, warmth (shelter), rest, belonging.**
- Distance below set point is the agent's cost ("surprise"), and the cost is **convex**, so
  whatever is most lacking dominates choice. No fixed weights.
- **Below zero, the scale runs to death (Decided, Chris 2026-11-03).** How far a need can
  fall below zero is the way to death, on the same scale for every need, so the night a need
  kills is the worst case in the ordinary measure (level -1, cost 4, the most any need can
  cost), with no penalty added beside it. Chris: "final days should register as the worst
  possible case in the normal measure. if thirst is not outweighing food when thirst is maxed
  we have a problem with the weighting." Food and water: below zero is a debt drawn on the
  body's reserve, which holds the daily need for the days the need takes to kill (§7.5
  numbers: 20 days of food, 3 of water); the need runs down at its usual rate, a meal pays
  the debt back, and death comes when the reserve is gone. Warmth, which is not a stock:
  the days spent at zero over the days it takes to kill.
  - **A night that kills costs the worst case for every day it takes away — Default (Claude's
    reading of the rule above, 2026-11-03).** Food, water and warmth at -1, rest and belonging
    at 0, on every day of the Keep projection (§7.6), discounted as any projected day is: a
    dead agent has nothing. Without it, the dying night cost 4 while the projection still
    counted the agent's life after it, and an agent died of thirst on a winter food trip that
    the projection valued at about 5.
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

- **Water is a good like any other (Decided — Chris, 2026-11-03).** It is gifted and
  bartered, up to the room in the receiver's gourd and pot. Chris's aim: one agent forages,
  another fetches water, and they meet and gift or barter to sustain each other.
- **Containers and carrying (Open — raised by Chris, 2026-11-03).** An emerging dimension:
  containers (gourds, pots and later skins for water; baskets for berries and other foraged
  goods) and porting as a service, with its transport technology (carrying by hand, pack
  goats, oxen, horses, wagons). Nothing yet limits what an agent carries except water, so a
  basket would do nothing until a carrying limit exists.
  - **The limit is on all carrying (Decided — Chris, 2026-11-12: "all carrying"),** daily
    trips and camp moves alike.
  - **Storage and carrying are technologies (Decided — Chris, 2026-11-12):** "storage on
    person, in the sleeping place might be default and suffer the most loss. but things like
    underground store or a granary and baskets and skins etc should be how this is handled."
    Goods are somewhere: on the person (up to what it can carry) or at its sleeping place,
    the defaults, where losses are highest; storage built in the world (an underground pit,
    a granary) loses less, and carrying gear (baskets, skins) carries more.
  - **No innate water container; containers are made goods (Decided — Chris, 2026-11-12):**
    "perhaps no water tech. gourds, skins, bladders, wood are all tech they can build. if we
    start them knowing gourds, let's have them build gourds. that way gourds can wear out and
    gourds can be duplicated. folks could have multiple gourds." The gourd stays known from
    the start (2026-11-05) but becomes something made, held, worn out and given, like a tool.
    This replaces the assumed gourd capacity.
  - **Carrying has dimensions, by kind of good, and gear raises it (Decided — Chris,
    2026-11-12):** "humans can carry/drag a lot of weight. but only with tech. with two
    hands you can't carry much. so tech increases the weight of what you can carry. probably
    also depending on the kind. like water you can't carry without tech. but tools you can."
    Bare hands carry little; water not at all; tools in hand. Gear raises what can be
    carried, kind by kind.
  - **The first material tree: foraging and hunting return secondary materials (Decided —
    Chris, 2026-11-12):** "for now let's assume that they are made from plant material from
    foraging. skins are made from hunting material. we are starting to reach our first real
    material tree. our primary foraging returns secondary resources. hunting and gathering
    bring food, but also skins and shells etc." Gourds are made from plant material that
    foraging brings in; skins from what hunting brings in.
  - **Both: some come with the haul, some take work, and some need processing (Decided —
    Chris, 2026-11-12):** "i think we probably have both kinds and this is the split between
    actions. some resources need further processing (or could use it) like tanning." Raw
    materials arrive with the haul or by work of their own; processing (as drying meat
    already is) turns them into what makes things, e.g. tanning a hide.
  - **The first set (Decided — Chris, 2026-11-12, on Claude's proposal: "yes that's a good
    first set"):** gourds (gourd fruit from gathering, dried for weeks, made into a water
    gourd); hides (from kills, tanned to leather, made into a water skin or a carrying bag);
    fibre (reeds, bark, gathered on purpose, made into a basket for loose food); bare-hands
    limits per kind, each piece of gear raising its kind's. Pits, granaries and dragging
    (sledges) come later.
  - **One load, with a cap per kind (Decided — Chris, 2026-11-12, on Claude's proposal:
    "yes this works well"):** each person carries one load, by weight; within it each kind
    has a bare-hands cap (water none, loose food a couple of handfuls, bulky goods an armful,
    tools in hand), and gear raises a kind's cap toward the whole load.
  - **Food and water can be eaten and drunk in place (Decided — Chris, 2026-11-12):** "one
    addition. water and food can be eaten in place." What is eaten where it is gathered is
    not carried.
  - **Carried children take part of the load, and the load is part of the day's effort
    (Decided — Chris, 2026-11-12):** "yes, carried children take part of the load. and
    carrying load is part of the calculation of daily load." The day's effort gains the
    weight carried times the hours walked with it (Decided — Chris, 2026-11-12, on Claude's
    proposal: "yes, go ahead and build it"); walking speed is unchanged for now.
  - **Fetching what was left is moving camp in more than one trip (Decided — Chris,
    2026-11-13):** "fetching goods that are at old camps seems a reasonable task to plan. its
    basically moving camp in more than one trip." On Claude's proposal ("agreed"): a site's
    forecast counts everything the member holds, with the trips back for what it cannot carry
    in one charged to the forecast's first week (a round trip per extra load) and what rots
    before it is fetched; the trips themselves are planned day by day by the ordinary planner,
    which gains a stop at goods lying where it knows of them, weighed against everything else
    it could do that day (the same stop reaches meat left at a kill). An agent knows of goods
    lying where it left them or where it has stood since (Default).
  - **Gear's worth is learned, slowly, and from seeing others (Decided — Chris, 2026-11-13):**
    "i want it to be learned, the accumulation of any tech should be slow. but once enough
    folks have gear, you learn from seeing that gear is better. so in an established culture
    gear is considered by all in planning." Raised by Chris: "a capacity increase should
    translate into less trips and more productivity." (Found 2026-11-13: the learned worth
    came only from what an agent's own hands could not hold, which the planner avoids, so it
    stayed near zero; and the forecast credited gear as more food in the same hours, never
    as fewer hours.) Not an imagined day with the gear.
  - **Gear is a strategy whose efficiency is learned like any other (Decided — Chris,
    2026-11-13):** "agents should mostly be learning the efficiency of strategies in a loose
    RL right? with our habit/norm structure." On Claude's proposal ("yes please"): each agent
    learns, by season, its return per hour of gathering on days with a basket or a bag and on
    bare-handed days (habit from its own days, norm from what others tell in chat, §4.4).
    The forecast credits gear held (or makeable) as the same food in fewer hours: the hours
    it gathers a day scaled by the bare return over the gear's. Before the gear has any
    experience or norm behind it, the agent's own shortfall (the 'l' flows) is its guess.
    *As built (Default):* a day's gear is a bag if it holds one, else a basket, else bare;
    the return is the food (what it restores) kept or eaten at foraging stops, as if without
    tools, over those hours, learned at the seasonal rate (`flowRate`) with the hours it
    forages a day; told in chat as the other seasonal values are. Wood a bag would bring is
    still credited by the shortfall. A water skin's worth stays mechanical (fewer trips to
    water, from what its vessels hold).
  - **As built (Stage 5h, 2026-11-13) — Default** (`tree.js` carrying, `params.carry`):
    - *Load and caps:* an adult carries 25 kg (a working child by its work rate), less its
      carried children (infant 8 kg, under 6 years 4); bare hands hold 1 kg loose, 10 kg
      bulky, no water. kg a unit: greens 1, nuts and roots 0.5, meat 0.5, dried meat 0.25,
      grain 0.4, wood 2, flint 1, clay 2, water 4 (a day's need is 2 units), pot 4, gourd
      fruit 1, dried gourd 0.3, hide 5, leather 2, fibre 1. Tools and gear go in hand.
    - *Effort:* 0.0004 food a day per kg carried per hour walked (25 kg for 2 hours is about
      a sixth of a day's food need).
    - *Where goods are:* at camp an agent's holding is its store where it sleeps. A day trip
      takes up only what it can carry; what it gathers beyond that it eats there, up to a
      day's food, and leaves the rest growing (or in its snares). Leaving camp for a planned
      night out it packs gear, its vessels' water and a night's food (best food per kg); the
      rest stays where it sleeps, and the evening out lives on the pack. Home again, the two
      join. A pot stays where its owner sleeps.
    - *The kill:* the killer takes up what it can carry (20 of a carcass's 100 meat in bare
      hands) and the hide if it fits; the rest lies at the kill, and the others hunting that
      herd take up what they can. Sharing is still gifts and barter where they stand; the
      killer no longer holds the whole carcass (it cannot carry it).
    - *Goods lying in the world:* at a hex, open to anyone, food rotting at its rate. An
      agent stopping there takes up what it can carry (food best per kg first); goods lying
      where it sleeps join its store. Water left lying is not kept.
    - *Order taken up:* tools in hand; then the pot, food best per kg, the material tree's
      goods (leather, dried gourd, gourd fruit, hide, fibre), then flint, wood and clay, as far
      as it can carry. The same order serves moving camp, a trip back and any stop.
    - *Moving camp:* each mover carries what it can in that order; the rest lies at the old
      camp. A member out that morning carries none of what was at camp.
    - *Fetching (2026-11-13):* an agent knows what lies where it left goods (moving camp, a
      kill) or where it has stood since, as it last saw it, food rotted since; finding a
      place emptied, it forgets it. Each day the planner may add a stop of 15 minutes
      (`carry.fetchHours`) at any such place within half a day, the route's cost counting
      what it would take up there. A site's forecast is scored twice, with only what the
      member carries there and with a trip a day back for the rest (each taking what it can
      carry, while trips bring something, up to the days until the camp weighs moving again,
      only if the round trip fits in a day), the trips' hours charged to the first week; the
      cheaper counts. Not priced: the effort of carrying on those trips.
    - *The material tree:* gourd vines on grassland, three times as thick by water, ripe in
      late summer (2 fruit an hour); a fruit dries where it is kept, about 3 weeks, and a
      dried gourd is made into a gourd in an hour (known from the start; each starting adult
      has one, a burn-in scaffold). A gourd holds 0.5 days of water and wears at 1/400 a day;
      several gourds hold more. A kill brings a hide; small game brings small skins (0.02 of
      a hide per unit of meat). Tanning (found by tinkering with a hide) turns a hide to
      leather in 4 hours; leather is made into a water skin (2 days of water, 1/300 a day)
      or a bag (any food or bulky good up to the whole load, 1/300). Fibre (reeds and bark,
      regrowing, thickest by water, 4 an hour) is plaited into a basket (4 fibre, 4 hours;
      loose food up to the whole load, 1/200). Water skin, bag and basket are found by
      tinkering with their material.
    - *Gear's worth (learned, not written in):* each agent learns, by season, what its hands
      could not hold each day ('l' flows); the Keep forecast adds it back for the kinds its
      basket or bag would carry. Vessels are worth the trips to water they save (as the pot).

- **Warmth has levels from two sources (Decided — Chris, 2026-11-02).** Shelter level sets a
  base, and a fire (firewood used up daily) adds to it. A hut without fuel is better than no
  hut; a hut with a fire is better still. So wood is a daily consumable for anyone who wants
  more warmth than the shelter alone gives. Seasons raise the need (cold days).
- Deepest chain (depth check): iron ore + charcoal → bloom → axe head → timber → house, about four.
- **Left out for now:** ~~hunting and~~ hides, herding, cloth, boats. (Hunting is now in:
  Landscape and resources, Game, Decided 2026-11-11.)

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
  - **A planted field can be harvested by anyone (Decided — Chris, 2026-11-03).** Planting gives
    no claim to the crop. What comes back to the planter must still count in its feedback, even
    indirectly. Chris: "if my friend harvests what i planted and they gift me a portion that
    should register as efficient." So the planter's learned return on planting includes what
    reaches it from its field through others (gifts, and perhaps trades), not only what it
    harvests itself. Mechanism: Open (to settle when farming is built, Stage 5d).
- Three resource classes, modeled on reality:
  - **Non-renewables:** finite deposits that must be found and mined (ore, stone).
  - **Renewables:** stocks with their own regrowth rate that can be overused (fields, game, fish, forest).
  - **Water:** its own cycle (rain and season → rivers, springs; flow varies by place and time).
- **Implementation — Default:** one resource mechanism with parameters (starting stock,
  regrowth rate, inflow), so all three classes are the same code with different numbers.
  Start with one instance of each.
- **Plant kinds share a hex's land (Decided — Chris, 2026-11-05):** "how about a dimension
  that allows for different plants. We have different ores. This could add a dimension to the
  food side of the equation. Then in a cell there's a fixed amount of plant life that can live
  there and forest becomes an extension of this." On Claude's follow-up, "Yes I like this
  plan." A hex holds a fixed amount of plant life; wild food plants of several kinds, trees
  and planted fields all take from it. A field takes land because everything that grows
  does, with no special rule. Replaces the separate plants, wood and soil caps, and settles
  the Open entry on fields taking land (§7.6).
  - **Kinds differ in what agents care about (Decided — Chris, 2026-11-05, on Claude's
    proposal):** season (greens in spring, seeds in summer, nuts and fruit in autumn, roots
    dug in winter), keeping (greens rot in days; seeds, nuts and roots keep), hours (greens
    quick to pick, roots slow to dig) and terrain (grasses on plains, nuts in forest).
    Without differences the kinds would be decoration. Winter roots and stored nuts are the
    real winter food that the flat winter-growth floor stands in for, so the floor retires.
  - **Forest is cover, not terrain (Decided — Chris, 2026-11-05, on Claude's proposal):** "yes
    i like this since that features heavily in certain tests we could do with this model."
    Ground (plains, hills, river, lake) is fixed by elevation; cover is what grows on it and
    changes. Moisture sets how strongly trees win on a hex, so wet ground starts forested and
    the generated map looks as before; cleared land stops being forest and grows back toward
    it if left. *Default (Claude):* a hex keeps the crossing time it started with when its
    cover changes, because travel times are cached on a fixed map; travel that follows cover
    comes later.
  - **The covers and their products (Decided — Chris, 2026-11-05, on Claude's proposal):**
    "yes we can add more later as we want." Three wild covers and fields:
    - *Grassland and herbs:* greens in spring (quick to pick, rot in days) and seeds in summer
      (slower, keep well). The seeds are the wild grain that summer foraging already yields
      and farming starts from; sowing turns them into a crop.
    - *Root plants:* roots dug in autumn and winter (slow; they keep). The real winter food.
    - *Trees:* wood all year and nuts in autumn (quick; they keep), so clearing costs both.
    - *Fields:* grain, as built.
    Four wild foods (greens, seeds, roots, nuts) replace the one, each its own stock in the
    Keep projection; more kinds can come later.
  - **Taking the crop versus taking the plant (Decided — Chris, 2026-11-05, on Claude's
    proposal):** "yes i like this." Each cover holds a share of the hex's land and spreads
    into bare ground at its own rate; trees also slowly shade out grass and roots, as strongly
    as the hex's moisture lets them; a field takes its share while it stands. Picking greens
    and gathering seeds and nuts take only the season's crop: the plants stay, and next year's
    crop comes from the same cover, so picking a hex bare empties it for the season but never
    wears it down. Cutting wood and digging roots take the plants and shrink the cover:
    clearing is cutting a hex's trees, and over-digging thins roots for years.
    - *Defaults (Claude, 2026-11-05):* a field is sown on grass and root land, taking its
      share from them (the hoeing clears it), never where trees stand, so forest must be cut
      before it is sown. Soil stays a separate stock (fertility, drawn by sowing), not a
      cover. Ground sets the land's size: hills hold less than plains.
  - **Trees are a slow competitor for the same land (Decided, same):** each kind grows toward
    the room the others leave; trees grow slowly and crowd out the rest over time. A cleared
    field left alone goes back to grass, then forest, so clearing is work that recurs.
    Succession is landscape, not economy, so the ledger (§4.2) is untouched.
  - **Processing makes products with other properties (Decided — Chris, 2026-11-05):** "Also
    different processed and products maybe. Like picking etc that affect those properties."
    (Read by Claude as pickling; unconfirmed.) Processing changes a food's keeping, its value
    and its hours. *Default (Claude):* each process is a recipe in the tree (§2 Goods,
    `tree.js`), found by tinkering and learned by seeing, with the tools it needs: drying
    (sun and hours) and smoking (fire) for keeping; parching and roasting (fire) for seeds and
    nuts; grinding seeds to meal (a stone); leaching bitter nuts to make them edible (water,
    hours); pickling later (a pot, salt).
  - *Cost, recorded:* this rebuilds the resource layer; every forage yield, the forest's wood
    and the farming numbers are rebalanced, so it is its own stage (DEVPLAN).
  - **As built, Stage 5g — Default (Claude, 2026-11-05; numbers in `params.js`):**
    - *Covers* are shares of a hex's land (plains 1, hills ½; forest stands on plains ground).
      Each spreads into bare land in the growing season from a seed floor; trees also take
      grass and root land at a rate set by the hex's *tree edge*, how far its moisture lies
      above the forest threshold (0 on drier land, so open land stays open). Wet land starts
      under trees, the rest open.
    - *Crops* (greens, seeds, nuts): the season's whole crop is ripe when its season opens,
      in proportion to the cover; picked bare, a hex is empty until next year, and what is left
      at the season's end is gone. *Plants* (wood, roots) are the cover itself: taking them
      shrinks it. Roots are dug in autumn and winter only.
    - *Planning priors* are set so that a few hours of foraging at them give about the old
      prior's food in every season; agents learn the true flows, including a lean first winter.
    - *Agents know the seasons:* they plan to gather a food only in its season (the gathering
      knowledge that ODD §5 assumes).
    - *Eating* goes from the food that rots fastest to the one that keeps best. Grain is better
      cooked only in a pot, as before; the other foods are better cooked on the fire.
    - *Processing*, the first three of the recipes above: drying greens (keeps), roasting nuts
      over a fire (keeps, a little more food), grinding seeds to meal with a stone (more food,
      cooked without a pot). Each is a know-how found by tinkering or seeing; work at home,
      by the hour. Smoking, parching, leaching and pickling are left for later.
    - *Fields take land* from bare land first, then grass and roots; the land is bare again
      when the field closes.
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
  - **Map as built in Stage 1 — Default (Claude, 2026-11-02; numbers in `params.js`):**
    - Five terrains: plains, forest, hills, river, lake. Crossing hours: 1, 1.5, 2, 2
      (fording), lake impassable.
    - Terrain from seeded elevation and moisture noise by quantile: lowest 4% lake, highest
      22% hills, wettest 35% of the rest forest. Rivers run downhill from 6 springs in the
      hills to a lake, another river or the map edge.
    - Default size 64 × 48 hexes; a year of 360 days.
    - *Plants, wood and the winter-growth floor below are superseded by Stage 5g's covers and
      food kinds (As built, Stage 5g, above).*
    - Placement: wild plants on plains (most), forest and hills; wood in forest; soil on
      land, doubled within a hex of water (floodplain); water in rivers, lakes and springs;
      clay on banks; flint, copper and tin in hills; iron in hills and forest; tin placed
      ~25 hexes from the nearest copper.
    - The one resource mechanism: renewables regrow logistically toward cap with a seed floor
      (a stripped hex comes back slowly), mostly in spring and summer for plants and wood
      (at a winter-growth floor in autumn and winter, a stand-in for winter food);
      water refills daily to a level that swings ±50% with the rains (wettest in spring);
      deposits never regrow. Seasons also give a cold factor (autumn and winter) for warmth.
  - **Game: big and small, as moving densities (Decided — Chris, 2026-11-11; mechanism
    Open):** "i think we need big game and small game. i think we want some density measure
    instead of individual agents for computation. but i think that we should have the density
    range more than just grow. so the big game concentration (herd) moves around, meaning
    hunters need to track it and follow it to maximize success rates. small game might be the
    same, but a different dynamic profile. ... i'm seeing small game maybe as having smaller
    fluctuations, but being more volatile. that might be wrong to model them. both should have
    some local growth, but both should also respond to hunting and deplete. and we might need
    to model a missing predator for these game other than humans to control the population
    outside of hunting (to avoid cycling populations)."
    - Game is a density on each hex, not animals as agents.
    - Big game is a herd: a concentration that moves, so hunters must track it and follow it.
    - Small game is a flow (Decided — Chris, 2026-11-11: "yes i like this model better. like
      a flow that the settlement taps and sinks."): a density on each hex that breeds where it
      stands and seeps into emptier neighbouring hexes. Hunting digs a hollow round a camp
      that fills from its edges, the source-sink halo of village hunting (Claude, from memory:
      Novaro, Bodmer & Redford c. 2000). Breeding supplies the surplus; moving in refills the
      hollow. Not a plant: a plant regrows where it stood. (Chris's first sketch, smaller
      fluctuations but more volatile, he was unsure of; superseded by this.)
    - Both grow locally, both are depleted by hunting, and a predator other than humans holds
      them down outside hunting, so populations do not cycle.
    - Small game's predator is its own density, damped (Decided — Chris, 2026-11-11: "let's do
      the damped version."): prey have a ceiling per hex, a predator's take saturates, and
      year-to-year weather varies prey breeding, so the two wobble round a balance instead of
      cycling. People and predators share the prey: a camp's hollow starves predators too, so
      part of the human take is prey predators would have eaten (compensatory hunting).
    - Herds move toward the best grazing (grass and water) near them and away from hexes where
      they were hunted (Decided — Chris, 2026-11-11: "i like your big game plan"). No set
      route: where herds go comes from the land and the hunting.
    - Big game has its own predator, which moves, hunts the herds and shifts with the seasons,
      for variety in herd behaviour (Decided — Chris, 2026-11-11). Default (Claude): it is a
      moving concentration like a herd, drawn toward herds; herds avoid it as they avoid
      hunters; its seasonal shifts come from following the herds, not from a route of its
      own; damped like small game's predator.
    - **Tracking is a trace in the land (Decided — Chris, 2026-11-11):** "if tracks are
      basically pheromones from an ant model the hunters can simply move up gradient. this
      works for predators too. then hunters and predators can leave their own trace that game
      can avoid." Herds, predators and hunters each leave a trace on the hexes they pass; it
      fades daily. Hunters and predators climb the herd trace; herds move down the predator
      and hunter traces. This replaces "away from where they were hunted" in herd movement.
      **Everyone leaves the people trace, not only hunters (Decided — Chris, 2026-11-11):**
      "yes trace from everyone to drive the multi-day." Gatherers, wood-cutters and the camp
      itself mark the land, so herds shy away from camps and hunters must range out.
    - **Hunting parties are emergent (Decided — Chris, 2026-11-11):** "i like this model
      idea. emergent hunting parties." A hunter's chance of a big-game kill rises with the
      number of others hunting the same herd on the same hex that day, on a saturating curve
      whose strength is a swept parameter. No party entity: who hunts together comes from
      the morning announcements (§7.6), ties and habit. Small game is hunted alone, the catch
      going by the density on the hex.
    - **The killer holds the whole carcass (Decided — Chris, 2026-11-11):** "yes", after the
      chimp case (Claude, from memory: whoever holds the meat keeps it; it spreads by begging
      pressure, Gilby at Gombe, and to allies, Mitani & Watts at Ngogo). No rule of division:
      all sharing of meat comes from gifts and barter (§2 Ties), so wide meat-sharing is a
      result, not a rule. As built: gifts and barter already happen at every hex an agent
      was at that day (§7.1), so hunters on the kill's hex meet the killer there before anyone
      back at camp does, and a party out overnight exchanges where it sleeps (Boesch's Taï
      result, hunters get more than bystanders, can then emerge). (Claude first wrote that
      exchange was at camp only; it is not.)
    - **Weapons (Decided — Chris, 2026-11-11: "yes to all of this"):** a stone-tipped spear is
      in the starting kit with the other stone tools (flint and wood, wears with use,
      multiplies big-game success). A new hunting ladder is found by tinkering: snares and
      traps for small game first (they catch while the owner is elsewhere), then the bow
      (raises big-game success at a distance).
    - **Injury: risks all people face (Decided — Chris, 2026-11-11):** "minor injuries that
      heal, major injuries that leave a disability, and death as possible outcomes. these
      should be risks all people face. in camp lowest level. outside not hunting higher.
      outside hunting big game highest. maybe with some risk in building." The same for
      both sexes and all adults; any division of dangerous work is a result. Default
      (Claude): a chance per hour by setting (in camp < out of camp < hunting big game; some
      added for building); a herd's size raises the big-game risk and the party's size lowers
      it (a second reason to hunt together, Ache injury records, Hill & Hurtado, from
      memory). A minor injury takes days of work away and heals; a major one cuts the
      agent's working capacity for life; the injured are kept by gifts from ties, as the old
      are (§2). A minor injury keeps 60% of the working day for 10 days (`injury.minorCut`
      0.6, Default 2026-11-16; Chris: "maybe our minor injuries are a bit too harsh?"). It
      kept 30% until then, while a major injury keeps 70% for life.
    - **Risk is learned and priced (Decided — Chris, 2026-11-11: "yes"):** each agent learns
      an injury rate per setting (§4.4: habit from its own injuries, norm from injuries seen
      and heard of in chat), and the planner charges each hour its expected cost: days lost,
      capacity lost, and death. Death is costed as the discounted life ahead, which also
      prices starvation in the Keep forecast (it priced hunger only as a squared deficit).
      As built (Default, Claude): a day dead costs the worst-need day (WORST_NEED_COST), the
      same price tonight's lethal night already used, so the life ahead is the projection's
      discounted days (about 100 at 0.99) at that price; it falls with age only near the end
      of life. In the projection, a step where food reaches death costs that from there on.
    - **Meat — Default (Claude, 2026-11-11):** one food kind, rotting about as fast as greens;
      the drying level (§ processing) turns it into dried meat that keeps. Big-game kills
      are large lots, small game small ones; sizes are parameters, balanced as we go.
    - **Knowing where game is uses habits and norms, not a new system (Decided — Chris,
      2026-11-11):** "part of this is learning where herds typically are, but this needs to
      be augmented probably with a local knowledge. what is true recently is more relevant
      that what was true last season." Default (Claude): game seen on a hex is a sighting
      like any resource, ageing as sightings do (faster for herds, which move); where herds
      usually are each season is one more learned value (§4.4: habit from own sightings, norm
      from chat, the same arbitration), which a fresh sighting or trace overrides.
    - **As built (Stage 5h; Default, Claude, 2026-11-11; numbers in `PARAMETERS.game`,
      `hunt`, `snare`, `injury`):**
      - *Small game* is the resource `smallgame` (ceiling 600 a hex of plains or forest, half
        on hills and rivers), gathered like a plant (8 meat an hour from a full hex). As
        fullness x: breeding 0.018·x·(1 − x) a day at the height of the growing season (about
        2 a year), times the year's weather (lognormal, sd 0.2); its predator load q takes
        q·0.0034·x/(x + 0.3)/(1 + 0.5q), grows by 0.98 of that and dies at 0.0014 a day. Both
        seep across each edge a day (prey 5% of the fullness difference, predator 3%). With no
        people (seed 1, 40 years): fullness wobbles 0.24–0.55 at year's end, no cycle. With
        people (seed 3 colony): a hollow round camps, 0.25–0.32 within a hex against 0.6–0.7
        seven or more hexes out.
      - *Herds* (24 of 60 at the start; all big game under a ceiling of 4000): each day up to
        2 steps to the best of its hex and the neighbours by grazing fullness, + 0.3 for water,
        − 0.5 × pack trace − 0.1 × people trace, + a little chance. They graze their own stock
        (grass regrows in the growing season, browse under trees half as well all year);
        calves in spring by how fed and the room under the ceiling; die of hunger when short.
        Split above 120; animals come in from the map's edge while fewer than 4 herds.
      - *Packs* (6 of 6): up to 3 steps a day toward a herd scented within 3 hexes, else up the
        herd trace, else ranging on in one direction.
        *Wolves are a control on the herds, not a competitor* (Decided — Chris, 2026-11-12:
        "they should take in proportion to what is there and we can assume their need is
        filled elsewise if the herd can't provide"; herds should hold out, fluctuations are
        fine). As built (Default): a pack on a herd takes 0.0009 × wolves × animals a day, with
        no saturation and no need; wolf numbers drift toward one wolf per 50 herd animals on
        the map (0.3% of the gap a day), times a yearly draw (lognormal, sd 0.2), so fewer
        animals means fewer wolves and a smaller share taken. (The first build had wolves
        breed by how fed and die of hunger, under a ceiling of 20: with people hunting too,
        wolves held at 12–14 while the herds fell from ~450 to ~100 and took 100–180 a year,
        more than people did, until the herds were gone on 2 of 3 seeds: a predator pit.)
      - *Traces* fade 15% a day (herds, packs) or 30% (people) and seep 10% to neighbours.
        Each person marks each hex it was at 0.1; a herd marks n/60 a step.
      - *Sign and knowing*: a hex reads as a herd at 1 with a herd on it, else herd trace / 3.
        A look takes it in; a sighting gives way to the seasonal habit over 4 days; where herds
        usually are is learned per hex and season (rate 0.1), habit and norm, one arbitration
        record for all hexes (16-bit, freed at death).
      - *The hunt*: a hunting stop is planned at the hexes with the most expected sign for the
        walk (6 weighed); expected meat an hour = learned meat per hour at full sign × sign ×
        weapon × the party it expects (campmates already planning a hunt within a hex). At the
        stop the hunter steps toward a herd seen on its hex or the next, else up the herd
        trace, while the stop's hours last, and the route goes on from where it ends. Once all
        have acted, each hunter on a herd has a chance an hour of a kill: 0.2 × weapon (spear
        ×2, bow ×3) × partyFactor (1 + (1 − e^−(k−1)/2), up to ×2) × n / (n + 20) for a herd
        of n; a kill is 100 meat. The learned meat per hour moves slowly (0.05; kills are
        lumpy). (At 0.05 an hour bare hunters rarely killed and stopped hunting.)
      - *Finding the animals within the hex* (Decided — Chris, 2026-11-11: "finding a group is
        way higher than finding a lone stray"): a hex is an hour's walk across, so being on a
        herd's hex is not contact; the chance falls with the herd's size by n / (n + H), the
        form the wolves' kills already take. H = 20 (Default: double the wolves' 10, since
        wolves smell game from much further; Chris was unsure of the value, so it is a
        balance parameter); pKill rose 0.15 → 0.2 to keep a herd of about 45 near its old
        rate. A stray gives 0.05 of the full chance, a herd of 20 half.
      - *Meat* restores 0.1 (×1.5 cooked) and rots 0.15 a day; drying makes dried meat (2 to
        1, restores 0.2, rots 0.004), known with drying.
      - *The spear's worth*: the projection makes it with flint and wood in hand, like the axe,
        and it multiplies big game's share of the meat (learned as if bare-handed).
      - *Snares*: tending snares at a hex takes their catch and sets 6 an hour (12 a hex at
        most); each takes 0.2 × fullness meat a day from the small game, the catch rots as
        meat, 2% of snares are lost a day. Found by tinkering with wood where small game runs.
      - *The bow*: found by tinkering with wood and flint, spear in hand; wood 2, flint 1, 6
        hours; ×3, lasts 160 hours; the best weapon held is used.
      - *Injury*: a day in camp 0.0002, an hour out 0.00005, an hour on a herd 0.0004 (× herd
        size / 60 within ×0.5–2, ÷ √party), an hour building 0.0002; 85% minor (10 days at 30%
        of working hours), 12% major (30% of working hours for life), 3% death. Rates learned
        from the true rates as prior (rate 0.01 a day); an injury's expected cost is 10 days ×
        0.5 + the major share × life × 0.5 + the death share × life at the worst-need cost.
      - *Injury priced by who and where* (Decided — Chris, 2026-11-12: "injuries should be
        priced in for things like if i'm injured i can't care for my kids"; the fault was the
        choice to hunt out with young children, which should feed back into planning, not a
        rule). As built (Default): an injury is priced where the agent sleeps tonight (camp, or
        out where its route ends; injuries come at day's end). A minor injury there costs as
        death if the hours it would leave (30% of waking hours, less care) cannot reach the
        nearest water it knows before its water runs out. A death costs its life ahead plus each
        dependent's, at its weight on that child (§7.4, the weight its gifts use): a dependent
        shares its carer's water and goes where it goes, so it dies with it. (Seed 1, year 8: a
        woman late in pregnancy with two children slept out an hour from camp, was hurt, had
        0.2 hours a day left and died of thirst there with three children.)
      - *Walking home a little at a time* (Decided — Chris, 2026-11-12: "the bug i'm seeing is
        that she didn't walk partially home"; walking, work and care are one budget of hours).
        An agent whose camp is beyond today's hours puts the hours its plan leaves toward the
        next hex on the way home, and the progress carries to the next day.
      - *Two fixes found by the same deaths* (2026-11-12, as built): an agent waking out may
        plan a drink at any water it knows within the whole day's hours, not only half (it
        need not walk back to where it woke; seed 2, year 7: stranded 10 hours out with water
        4.0 hours away and a reach of 3.9, a carer and two children died of thirst); and a
        camp that moves while a member is out does not charge it the walk (seed 3, year 7: the
        charge left a hunter low on water 2 hours that day, short of the 3 to water).
    - Why now (2026-11-11): hunting is part of the pre-known foundation (Chris, 2026-11-05)
      but was left out; game is the scattered winter food that the ethnography says pulls
      bands apart in winter, as stores pull them together; and lumpy returns are the classic
      case for sharing.
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
  ~~Exception, stated: the household is a **formal unit by rule** (§2); only its membership
  emerges (audit, Chris agreed)~~ (withdrawn 2026-11-04: households are emergent, §2; no
  exception remains)
- specialization and the supply chain; any division of labor by sex (2026-11-04)
- partners moving between bands, and any pattern in who moves (2026-11-04)
- family structure: who lives, plans and raises children together (2026-11-04)
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
- ~~**Arbitration — Default (proposed):** weight habit and norm by recent reliability (precision
  weighting: norm as prior, habit as evidence). Equal reliability gives a blend; unequal acts as a switch.~~
  Superseded by the next bullet (2026-11-03).
- **Every learned value has a habit, a norm, and a record of which pays off (Decided — Chris,
  2026-11-03):** "in all these cases where the agent is learning some value they keep both a
  habit and a norm. and then they keep a comparison of those, and how often each pays off.
  they either blend using this estimate or plan with one or the other randomly using the
  estimate, and at extremes the estimate probably overrules the other (only plan with one)."
  The learned values are:
  - the yields;
  - the seasonal flows (food and wood gathered, and food and wood netted in exchange);
  - the usual evening food level;
  - the usual working day;
  - the return on sowing.

  Until now only the yields had a norm. So an agent could not learn from others what a
  season brings before living through it.
  - **As built (Default, Claude):**
    - **Blending.** The agent blends, the first of Chris's two options. Each time its own
      experience of a value comes in, it scores how far the habit and the norm each missed,
      as a running mean of the squared miss (rate `arbRate` 0.1). The weights go by the
      inverse of those scores. A weight beyond `arbExtreme` (0.9) becomes 1: at the extremes
      one source alone is used.
    - **Before experience.** Before any experience of its own, the agent uses the norm if it
      has one. Before the scores exist, it weighs the two equally.
    - **What feeds the norm.** As before, the norm comes from others' experience, not the
      agent's own. Yields are taken from what an agent sees others get, and from what it
      is told in chat. For the other values, a speaker in chat tells its own habit for each
      season (what it has found a day brings). It tells only values it has lived, so an
      agent can hear about winter in summer. Norms move at `normRate`.
    - **Scoring.** Both sources are scored against the agent's own experience, which is
      what "pays off" means here.
    - **Rates (Decided — Chris, 2026-11-03: "fix 1 and 2 please").**
      - **Told values.** These move the norm at the seasonal habits' rate (`flowRate` 0.05),
        not at `normRate` 0.2. At 0.2, with up to 5 chats a day, a seasonal norm was mostly
        replaced every day: just the last few speakers, a jumpy source scored against a slow
        one.
      - **The working day.** It learns at 0.05 like the other seasonal habits, not at 0.3.
      - **Yields.** Yield norms from seeing and being told today's yields keep `normRate` 0.2.
    - **Replaces** the fixed weighting of yields (habit by experiences capped at 20, norm
      weight 3).
  - **Result, bands, seed 1, three years (one run each; nothing given, and farming known).**
    - **Norms reach everyone.** By the second spring all 100 agents had heard norms for
      every season.
    - **No first-winter knowledge.** Everyone starts on the same day, so no one has a winter
      to tell before the first winter. The heard norms only start to count once ages
      overlap (births, Stage 6).
    - **Habit and norm about equal.** Weights sat near 0.5 for the flows, the working day
      and the return on sowing. Nobody reached an extreme: members of a band live on the
      same land in the same season, so the two sources miss about equally.
    - **Yields went to the norm alone in year 1, then 0.5.** An hour's yield from a full hex
      has no noise in the model. So the first observed norm is exact, while the habit is
      still climbing from its prior. Once the habit catches up, both miss by zero and count
      equally.
    - **Survival and farming.** All 100 alive in both runs. Farming fell: with it known, 2
      seeds sown in three years against 155 in the shared-hut run before this change.
      Neither change is attributed: one run each.
    - **Cost.** Hearing in chat is 0.2% of run time.
  - **Open:** this ODD's Decided line above says norms are updated "its own included". Since
    Stage 3 the code has fed norms from others only, and this build keeps that, so the habit
    and the norm stay separate sources to compare.
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
- **Bounded partner search (Decided — Chris, 2026-11-03).** No one can check every other
  person at a place, so a perfect market is impossible at high numbers. A trader tries known,
  trusted partners first (not the crooks) and a new person only rarely, and stops at about a
  dozen. Chris: "all folks will trade first with known trusted vendors (not the crooks tho)
  and pick a new person only rarely."
  - **As built — Default (Claude, 2026-11-03):** partners it has dealt with, most trusted
    first, skipping any whose unreturned gifts have reached the grudge limit (§2 Owing); then
    others at the place in random order; 12 in all (`partnersTried`). A partner whose trades
    felt unfair is not skipped, only ranked lower (an unfair trade adds half the kindness).
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
  scarce holders in matching (§4.7), who plans first at a camp (§7.6), and whom an
  agent chats with beyond its ties (§4.6). Noise on others' reports (§4.6). Others: Open.

### 4.9 Collectives
- Households and tribes, both as emergent tie clusters (households: who plans around whom;
  formal unit withdrawn 2026-11-04, §2).

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
- **Tie structure within bands (Chris, 2026-11-04: "are tehre local cliques in bands or are
  bands a secure clique?"; tracked from before births, to see what children change).**
  - *As built — Default (Claude; `world.tieStructure`, sampled each period):* a strong tie is
    mutual, each having had at least `measures.strongTie` (2) kind offers from the other,
    faded over 60 days. Over camps of 2 or more, the means of density (share of pairs
    strongly tied), clustering (of a member's strong ties, the share tied to each other) and
    the largest group joined by strong ties (share of the camp); and the share of all strong
    ties that lie within a camp.
  - *Baseline, before births (bands, seeds 1–3, three years, read every 180 days at
    thresholds 1, 2 and 4):*
    - **No strong tie ever crossed between camps,** at any threshold, on any seed. Bands are
      closed social worlds; a partner from another band has nothing to build on yet.
    - **Large camps are loose webs, not cliques.** At threshold 1 a camp of about 20 is one
      connected group, with density 0.2–0.6. At threshold 2 it breaks into one main cluster
      plus pairs and loners (density 0.03–0.3). At threshold 4 only pairs remain. Clustering
      runs near density or a little above, so there are no marked local cliques inside a band.
    - **Small splinter camps are the real cliques:** density 0.8–1.0 at threshold 1 for camps
      of 2–12 (for example seed 3, a camp of 12 at 0.95).
    - **Ties are seasonal:** strong ties peak at the end of each winter and fall by half or
      more through summer, because gifts and barter peak in the lean seasons and tallies fade.
      The band tightens in hardship and loosens in plenty.

---

## 5. Initialization

**Blank start at zero (Decided — Chris).** Agents are placed on the landscape with the lowest
quality level of know-how, no ties, no households, and near-empty norms. Households, tribes,
trade places and price norms must all form.
- **Starting know-how: stone and fire (Decided — Chris, 2026-11-02).** Agents start knowing
  fire and the stone tools (axe, hoe/sickle, pick), as Homo sapiens had both long before any
  economy.
- **By default no tech level is known; what is known at the start is a setting (Decided —
  Chris, 2026-11-05):** "nothing known means no known tech levels. things like hunting and
  gathering and fire and tools are pre-known assumptions." Gathering, fire (and cooking with
  it) and the stone tools are assumptions of the model, known to all. Every level on a ladder
  (lean-to, pot, hut, farming, processing) starts unknown and must be discovered. *Default:*
  the start set is a list in `PARAMETERS` (`agents.knowhow`), recorded in every packet, so a
  variant that starts some levels known is one setting. This replaces the level-1 Default below.
  - **The gourd is assumed, for now (Decided — Chris, 2026-11-05):** "let's leave it as a
    starter tech for now." Everyone can carry water home in a gourd from the start; the water
    ladder's first discovered level is the pot.
- **Starting ages: adults of mixed age, no children (Decided — Chris, 2026-11-05, on Claude's
  proposal):** "yes i suppose we need some way to establish realistic initial colonies."
  Agents start between about 15 and 45, both sexes in about equal numbers, with no children
  and no kin: starting with children would mean writing in mother–child links (§4.2, no
  prebuilt ties). Families form only from births; a real age structure (children, parents,
  elders) builds over the first generation.
  - *Spin-up — Default (Claude, 2026-11-05):* the first generation is a burn-in, not read for
    results. A colony run past it can be saved and reloaded as the starting state for
    experiments, as climate models spin up, so each experiment does not repeat the decades.
    Its cost is recorded too: three-year runs no longer show anything about generations, so
    runs grow to decades and camp weighing must get cheaper (DEVPLAN Stage 6).
  - *As built, Stage 6 — Default (Claude, 2026-11-06):* ages are uniform over
    `agents.startAge` (15–45), each agent female with chance one half. `colony.mjs` saves a
    world with its `PARAMETERS` and the generator's state, and reloads it to carry on the same
    draws (checked: a reloaded copy runs identically); `runner.mjs --save FILE` and
    `--from FILE`. Headless only. About 13 MB per 100 agents.
  - *Staggered first conceptions — Decided (Chris, 2026-11-07: "let's go with your plan for
    a staggered start on the initial state"; "we might need to adjust this"):* every woman
    starting together childless conceived in year one (0.2 a month), so the first births came
    as one cohort, nursed together, and in seed 3 their care hours and milk in the year-two
    autumn tipped every camp into famine (40 adults dead; 2 with care hours off). Each woman
    of the starting population now waits a time drawn uniformly over `life.startWait` years
    (3) before she can first conceive, as if she had weaned a child before the run began. A
    start state only: no child or tie is made, and women born in the run have no such wait.
    To watch: a famine that kills many mothers may bring the survivors back into step.
    Result (20 years, seeds 1–3, one run each): first births spread over years 2–4 (10–16 a
    year, was 30–39 in year 2), but famines go on (seed 1 lost 60 adults in years 2–3 with
    few infants), and year 20 holds 18 / 25 / 41 alive (was 68 / 26 / 37). The cohort was one
    trigger, not the cause.
  - *Speed, Stage 6 (2026-11-06):* most planning time went to scoring every candidate stop
    by a full one-stop day, and a camp's weighing repeats that for every member at every
    site. For one gathering or drinking activity, a stop's one-stop day differs only in what
    it brings in and the round trip, so a stop that two others match or beat on both cannot
    make the shortlist and is dropped unscored. About 3× faster (bands: 6 → 2 ms per
    agent-day on this machine). Among stops of equal cost, ties now fall to the nearer stop
    rather than to hex order, so agents walk a little less; seeds 2–4 kept 100/100 to day
    180 either way.
- **Moving camp (Open — Chris, 2026-11-03).** A band camped in one hex strips the ground
  around it when it cannot move (§7.6 Stage 3 note). Chris: moving camp "is starting to sound
  better. this creates a tradeoff for hunter gatherer vs agriculture": mobility keeps the
  forage fresh, fields tie a band to one place. Design to come; it ties to carrying (§2).
  - **The band moves as a group (Decided — Chris, 2026-11-03):** "bands typically move as a
    group." The camp is one hex holding the band's homes.
  - **When and where: the summed cost of the members (Decided — Chris, 2026-11-03, on
    Claude's proposal):** "i like this." Candidate sites are hexes beside water within a day's
    walk. Each member scores each site by its own planning cost there (forage and wood within
    reach, mostly). The band moves to the site with the lowest summed cost when it beats
    staying by more than the cost of the moving day. Fields and huts left behind count against
    moving, which is the hunter-gatherer vs agriculture trade-off. No leader is written in: the
    rule makes a group decision but not who decides.
  - **Who goes: each member chooses (Decided — Chris, 2026-11-03, on Claude's proposal):**
    "you can implement this, but i would expect everyone to go under this." When the band
    moves, each member follows it, stays, or joins another camp within reach, whichever costs
    them least, with ties left behind costed through belonging. A band is whoever camps
    together, so bands can split and merge. Chris expects everyone to go: belonging should
    outweigh a field.
  - **Leaving a camp that stays (Decided — Chris, 2026-11-07, on Claude's proposal):** asked
    whether a member may leave for another camp when its own camp stays put: "yes". On the
    days the camp weighs moving and does not move, each member still weighs joining another
    camp within reach against staying, by the same costs. Found 2026-11-06: in seed 2, year 4,
    a camp of 28 starved beside a camp of 9 holding about 75 days of food a head, because
    the choice to join came up only after the whole camp had decided to move.
  - **Crowding enters the forecast (Decided — Chris, 2026-11-10; mechanism Open):**
    "population does need to feature into future predictions, but i'm not exactly certain how
    to do so." Found 2026-11-09: in seed 2 with no tech, two camps merged to about 300 and
    starved in year 27. Every option a member weighs (follow, stay, join) is planned as if the
    member were alone at the site, so no one ever saw a reason to leave the crowd.
    - **Learned thinning, linear in camp size (Decided — Chris, 2026-11-10, on Claude's
      proposal):** "sure let's try that." Asked for "a blend of A and B": the forecast scales
      with headcount, and how much is learned from experience. The member's yield from full
      land stays as learned; what crowding changes is how full they expect the land to be.
      Each member learns, by season, how much the land around camp thins in a week per
      person camped there. A site's expected fullness for n campers is what they saw, less
      that amount times n, and never below bare.
    - **As built (Default, 2026-11-10):**
      - **Learning.** At each weekly camp check, a member who has stayed at the same camp
        through the same season compares the land within `look` hexes (food in season and
        wood, as they have seen it; the shortlist's measure) with a week before. The drop,
        divided by the camp's size then, is one experience (rate `camp.thinRate`). It is
        told in chat as a norm, like the other seasonal values. The prior is 0, so the forecast
        starts as before.
      - **Forecast.** When a site is scored, every hex's seen fullness for food and wood is
        cut by half a week's thinning times n: the mean over the week weighed, not its end. A
        learned negative (regrowth outpacing the take) counts as 0. n is the members plus any
        camp already at the site; staying when the camp moves counts the member and any
        other camp at the hex, since the rest are assumed to follow; joining counts that camp
        plus the member.
  - **A site's forecast prices rebuilding and its own land (Decided — Chris, 2026-11-10):**
    "the forecast should price in the cost to rebuild. so a site with infrastructure beats one
    with out other things equal. but a stripped site with infrastructure should lose to a rich
    site with none." Found 2026-11-10: the months-long Keep forecast of a site held its
    shelter fixed (bare ground for months where no dwelling stood, as if no one would build)
    and brought food in at the member's usual seasonal rate whatever the site's land. A hut
    on stripped land outweighed rich land by months of warmth against one day of food. With
    tech, people gathered the same food as without (1.66 against 1.67 days' worth a day, 8
    years, seeds 1–3) for 1.3 more hours of work.
    - **As built (Default, 2026-11-10):**
      - **Rebuilding.** At a site whose best free dwelling is less warm than the member's own,
        the forecast assumes they rebuild what they have, and its first week carries the hours:
        the build's hours (fewer with an axe) and its inputs at their own hour costs, times how
        complete their own shelter is, shared among those sleeping in it now. Tonight is spent
        in the rebuilt shelter too (a small optimism).
      - **The site's land.** Each member learns, by season, how full the land around camp
        usually is (the thinning measure, at each weekly check; rate `camp.landRate`, told
        in chat as a norm). For the rest of the current season the forecast scales what they
        gather (food and wood, not what they net in exchange) by how full they have seen the
        site's land, less crowding, against that usual fullness. Later seasons come in at the
        usual rate, since the site's land in those seasons is unseen.
  - **Newcomers earn their way in; splits follow peer groups (Decided — Chris, 2026-11-10;
    mechanism Open):** "new members should be treated differently already due to ties. they
    need to earn their way into the group by gaining ties. when two groups 'merge' they might
    still have largely separate internal structures, so when they choose to split, they might
    split in different ways. with peer groups staying together." Already true: belonging and
    gifts come only through ties, so a newcomer starts with neither. Missing: each member
    chooses alone, assuming the rest follow, so a peer group cannot leave together.
  - **Splitting is emergent, following the ethnographic pattern (Decided — Chris,
    2026-11-11):** "splitting should be emergent from the model, ideally following this
    pattern." The pattern (from Claude's summary of the literature, from memory, 2026-11-11):
    where cold-season food is stored in one place, bands gather at a winter base and live on
    the stores (Great Basin, Plateau, Northwest Coast); where it is scattered game, they split
    into a few families (subarctic). No rule sets group size by season.
  - **Storing for winter is part of the plan (Decided — Chris, 2026-11-11):** "i think storing
    for the winter should be part of the plan. it might already be, in which case we might
    need to tweak its balance." The Keep forecast already runs months ahead; whether bands
    store enough to winter in one place is being checked.
  - **Multi-day trips (Decided — Chris, 2026-11-11; mechanism Open):** "multi-day trips sound
    good, and they might cycle well with our warmth need and fit better in summer when that
    penalty is less." A party goes out from camp for days and carries food back, as
    collectors' task groups do (Binford 1980), instead of the whole camp moving.
    Hunters stay out until they must come back (Decided — Chris, 2026-11-11): "hunters should
    stay out until they must return for provisions or to get needs met." No set trip length:
    a hunter returns when the food carried runs low or another need (warmth, belonging, a
    child) costs more than staying out.
    **Where to sleep is part of the morning plan (Decided — Chris, 2026-11-11):** "they make
    their plans in the morning, and when they make their plans in the morning, they should
    plan to whether they come home for the night or not. But that choice ... should be
    dependent on their prediction of tomorrow's gains based on those two outcomes." A route
    ends either at camp or at a hex where the agent sleeps out; each is valued as tonight's
    cost there (shelter, fire, belonging, food carried) plus the predicted gain of tomorrow
    from there. A trip is a run of mornings that plan a night out; no trip entity. Default
    (Claude): tomorrow's gain from a place is estimated from what is known near it (sightings,
    traces, the seasonal habit), not by planning tomorrow in full, to keep the cost of a plan
    near today's. A party sleeping out holds its own evening exchange.
    *As built (Default, Claude, 2026-11-11):* a night out is weighed once the day's route is
    built (inside the search it doubled the planner's cost): the route if it ends in a hunt,
    the route with each hunting stop added at its end, and a whole day of hunting at each. A
    night out has no shelter; its belonging is only from ties sleeping out within a hex (as
    planned that morning, and as it turns out that evening), and nothing announced at camp
    reaches it. Tonight's walk home is put off, not saved: with p the sign it expects there
    tomorrow, tomorrow gains (2p − 1) × the walk from camp, at the best gain per hour of
    the morning's stops, a day on. Tomorrow's water is the walk to the nearest water it
    knows from there (none within half a day: a worst-need day). (Saving the walk outright,
    and letting any route sleep out, sent a third of the bands out every night and 33 died
    of thirst in a year; hunters who tracked into land where they knew no water.) A hunter
    who has followed game, or whose camp has moved, beyond a day's walk of camp plans every
    route as a night out (an empty day: the night where it is) until camp is in reach. (Until
    then such a hunter's day scored Infinity and its walk home NaN, which spread by chat as
    learned norms until whole camps scored every drink as NaN and 85 died of thirst beside a
    river, seed 3 colony; learning now ignores a value that is not a finite number.)
  - **Contests between bands, without warfare (Decided — Chris, 2026-11-10; mechanism
    Open):** "actual fighting was probably rare on the scale that there were casualties. more
    likely there were skirmishes to determine relative strength an that determine which band
    would stay and which would back away." Open: how this sits with open access (§2), since a
    band that backs away has been excluded from the site.
  - **As built (Default, 2026-11-03):**
    - **Weighing.** Each camp weighs moving every 7 days, and a move is weighed over those 7
      days. Its summed cost is the walk-day at the site plus 6 ordinary days, against 7 days
      staying.
    - **Day cost.** A member's day at a site is the cost of its best planned day were home
      there, searched without the trade arm. The site has no shelter yet, and fields beyond
      half a day's reach of it bring nothing back. The walk-day has the walk's hours taken
      out of the day.
    - **Shortlist.** Candidate sites are plains or forest beside water within a day's walk.
      Five are shortlisted by how full of plants and wood the members last saw the land
      within 2 hexes of each; members see only what they have seen.
    - **Belonging.** It enters each member's own choice as a day's belonging cost weighted
      like the planner's: tonight plus the discounted projection. The belonging counted is
      from ties to those who would camp there, assuming the rest of the band follows.
    - **Shelter and goods.** A hut or lean-to is left behind. All goods are carried; there
      is no carrying limit yet. It comes after game, ahead of containers (Chris, 2026-11-11:
      "not until we do game but we can add it to our plan"; Stage 5h).
    - **What can't be carried stays, open to anyone, and spoils (Decided — Chris,
      2026-11-12):** "open to anyone, like huts, but still spoils." Goods left at the old
      camp are things in the world at that hex, as huts and fields are; anyone who comes may
      take them, and food left there rots at its own rate.
    - **Merging.** A camp moving to a hex where another camp is merges with it.
  - **Huts and fields are things in the world; anyone may use a hut (Decided — Chris,
    2026-11-03):** "yes, huts and fields should be things in the world. anyone may use the
    hut." This is open access, as with harvest (§2). A structure stays where it was built and
    weathers whether or not anyone lives in it. An agent arriving at a camp takes the best
    empty structure there.
  - **A hut shelters several, who share by choice (Decided — Chris, 2026-11-03, on Claude's
    proposal):** "yes i like your emergent model." A hut holds several sleepers, and a
    lean-to one or two. Each evening each agent chooses where at camp to sleep. Anyone
    sleeping in a structure may build on it or repair it, so who puts in the hours and who
    rides along is left to the model. No household is written in: one is just what we see
    when the same people keep sharing a hut. Shared body heat is left out for now.
    - **As built (Default):**
      - **Capacity.** A hut, once begun, holds 5 sleepers; a lean-to or bare ground, 2.
      - **Choosing a bed.** Each evening, in a random order, each agent moves to the warmest
        structure at its camp with room. Among equally warm ones it picks the one whose
        sleepers it has the strongest ties to, and otherwise it stays put. No one is turned
        out of a full hut. An agent with no room anywhere has bare ground of its own to
        build on.
      - **Wear.** Each structure weathers once a day however many sleep in it. When a
        part-built hut falls, everyone sleeping in it counts it as an abandoned project.
    - **Result, bands, seed 1, three years (one run each).**
      - **Sharing.** Huts fill: 4.8–5.0 sleepers in each lived-in hut. The work is spread:
        80–95% of those sleeping in a finished hut had put hours into it, and its top
        builder did 32–54% of the hours. Free riders are few so far.
      - **Warmth.** Midwinter warmth was 0.57–0.75 against 0.45–0.50 with one agent per
        structure. In the bands year (smoke test), 73 huts were started against 193.
      - **Farming known.** 56 seeds were sown in year 3, then 99 the next spring, and 535
        grain reaped, against 12 seeds in three years with one agent per structure.
        Possibly the hours freed from hut-building; not checked.
      - **Nothing given.** 83 of 100 alive, with 15 hunger deaths in year 3. Most were in a
        camp that merged to 39–40 and stayed that size through the winter. With one agent
        per structure the same seed kept 98. One run, so the cause is unchecked: watch for
        merged camps outgrowing their land.
  - *(Superseded 2026-11-03 by the bullet above: one agent per structure.)*
    - **As built (Default):**
      - **Occupancy.** ~~A structure (lean-to, hut, or a hut part-built) shelters one agent, as
        when each agent built its own. Arrivals take the empty ones best first, in the order
        they arrive.~~ Anyone in one may go on building it.
      - **Wear.** Empty structures weather at the same rates and are gone at zero.
      - **Own fields.** A planter knows when its own field ripens, so it counts the field as
        seen ripe on that day. Others learn of ripe grain by seeing it, or by being told in
        chat by someone who worked that hex.
      - **Far fields.** A field farther than half a day's reach from home brings nothing back
        in the projection.
    - **Result, bands, seed 1, three years (one run each).**
      - **Returning.** Camps come back to sites they used before: 152 returns in 299 moves
        with nothing given. By year 3, arrivals took finished huts 96 times and part-built
        ones 152 times.
      - **Huts and seasons.** Huts are lived in through winter and empty in spring, when
        camps move on (39–64 empty finished huts each spring).
      - **Survival.** 98 of 100 alive with nothing given; 95 of 100 with farming known.
        Winter is still hard: mean food −0.16 to −0.36 and warmth 0.41–0.52 at midwinter.
      - **Farming, nothing given.** The first sowing was in the third spring (8 seeds, 49 by
        summer). The planters reaped 319 grain and others 65, against 31 seeds and 274 grain
        with fixed homes.
      - **Farming, known from the start.** Only 12 seeds were sown in three years, against
        115 seeds and 1,032 grain with fixed homes. Mobile bands farm far less: Chris's
        hunter-gatherer vs agriculture trade-off, appearing without being written in.
      - **No far fields.** Nobody reaped a field more than 3 hexes from home.
    - **Result, bands, seed 1, two years.**
      - **Survival.** 98 of 100 alive (2 hunger deaths), against 87 with homes fixed near the
        band centre (12 hunger, 1 old age).
      - **Splitting.** The bands scattered in the first spring. At the start there are no
        ties, so belonging holds no one, and by day 60 there were 16 camps, some of one or
        two agents.
      - **Re-forming.** As ties formed they came back together. From day 180 on, membership
        never changed: 7 camps of 24, 20, 20, 17, 10, 4 and 3. So Chris's "everyone goes"
        holds once ties exist, not before.
      - **Seasons.** Camps move most weeks in spring and summer and rarely in autumn and
        winter, when the hut keeps them. Huts finished in autumn are left behind in spring.
      - **Land and food.** Plants near home averaged 0.51 of cap, against 0.46. Winter food
        dipped as before (0.40 at day 300). No one sowed in two years, against 5 seeds with
        fixed homes.
      - **Cost.** Weighing camps about doubles run time: 3.4 ms per agent-day against 1.65.
      - **Bug fixed while testing.** The walk at first shortened every day of the year-long
        projection, not just today. A 1.5-hour walk then looked like it cost hundreds, and
        camps barely moved: 8 moves in two years, homes all in one hex, and 0.34 of plants
        near home.
- **Starting layout: bands (Decided — Chris, 2026-11-02, on Claude's proposal).** Several
  bands (say 5–8 of 20–40 agents) start a day or two's walk apart. No ties or households are
  pre-built; only nearness is given.
  - **Expected, not written in (Chris):** a few households form in each band, each with its
    own shared shelter. Bonds run closest in the household, then the band, then strangers.
    Bandmates may or may not be trusted ties. One can be a tie without being trusted (the
    early end of the trust spectrum, §2 Ties). Where gifts are given and not all can be
    returned, grudges arise; some agents end up in no trusted pair but still barter.
- ~~**Starting know-how, continued — Default:** level 1 of each ladder is known too (cooked wild food, gourds, lean-tos), as
    stone-and-fire foragers had them. Level 2 on (farming, pottery, huts, metals) must be
    discovered by tinkering.~~ Replaced 2026-11-05 by "By default no tech level is known" above.

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
- **Both parents consent, each by their own ROI (Decided — Chris, 2026-11-04, on Claude's
  proposal):** "i like your model that need both to consent, but that there is an imbalance
  and that might lead to female choice." A child happens only when a female and a male who
  are strongly tied both judge it worth it. Her costs are pregnancy, nursing and care hours;
  his are whatever he expects to give. Nothing obliges the father, so his ROI is nearly always
  positive, and the mother's choice is likely the binding one. Female choice, and whether
  fathers invest, are results.
- **Conception: weighed each month, the partner graded by the tie (Decided — Chris,
  2026-11-05, on Claude's proposal):** "yes, do they decide and try each month? that way she
  can decide a new father next month if they fail?" Yes: each month a woman free to conceive
  (fertile, not pregnant, not nursing) weighs a child afresh with each fertile man she has a
  tie to. Her expected return counts what she expects him to give her and the child, graded
  by his kindness to her, so "strongly tied" above is a gradient, not a threshold. She picks
  the man with the best return; if he also judges it worth it, they try, and conceive with a
  monthly chance of about 1 in 5 (the human rate; a `PARAMETER`). A failed month binds no
  one: next month she may choose again. Whether lasting pairs form, and whether fathers
  invest, are results.
  - *Noted (Claude):* paternity is known once a child is conceived. Uncertain paternity
    (shared among several men, as in some Amazonian societies) is a later robustness setting.
- **Fertility limits (Decided — Chris, 2026-11-05, on Claude's proposal):** "sure." A woman
  can conceive from about 16 to about 45; pregnancy lasts about nine months; no conception
  while nursing. Births are then at least about three years apart, near what foragers show,
  without the spacing written in. Numbers are `PARAMETERS`. *Default (Claude, not asked):*
  a man is fertile from about 16, with no upper limit but death.
- **She counts the children she already has (Decided — Chris, 2026-11-13):** "yes, she should
  count the children she already has." Asked after the 10-year runs (seeds 1–3), where children
  dying of hunger rose from year 6 (33–44 a seed over years 6–10) while each woman weighed
  another child as if she had none: the only brake was no conception while nursing.
  - **How it is counted — Default (Claude, 2026-11-13):** the new child's daily hours (its
    care, its food at her hour cost, less its help) come out of the hours her day has free
    once the children in her care have theirs, and cost her, on top of the hours themselves,
    the rest they take, valued in
    hours as belonging is in her return (the rest need's cost, times half the hours that meet
    it). Her free hours are her day's capacity less her usual work today, which already holds
    her charges' care and the food she gathers for them; year by year over the new child's
    childhood they grow back as her charges grow up (less care, more help, then grown) and
    shrink as their food need rises. The rest cost has no floor at zero rest: hours her day
    does not have cost more the further past it they go. A woman with time to spare pays
    about the hours alone, as before; one whose day is full pays far more.
- **Care for a child is an investment, not a gift (Decided — Chris, 2026-11-04, on Claude's
  proposal):** care given to a child stays out of the owing balance (§2 Ties), so a carer never
  holds a grudge against an infant. The carer values the child like a long build (§7.6 partial
  projects): what a grown child is worth to it, times its learned chance the child lives to
  grow up. The child's side builds as usual: care received counts as kindness, so its ties to
  whoever raised it grow from nothing (no prebuilt tie). Grown, what it gives back is the
  return, and that teaches the next parents what children are worth. Chris: "in a way it works
  through the ties, just longer term. by investing in her child the child's strongest bonds
  will be to her. so when the child grows and can work. the child will reliably gift to the
  mother. so raising children is the way to get secure bonds." Rejected: a written bond
  (parents give to children without keeping count), which would write in who invests and why.
  - **How the valuation becomes daily care (Decided — Chris, 2026-11-06, on Claude's
    proposal):** "Let's go with your model. It looks good. I'm not sure what would be
    perfect or right, so let's go with your model." A parent counts its child's needs in its
    own cost, as with a tie (§2 Ties), at a weight: the share of its belonging it expects a
    grown child to supply (judged from its strongest ties now, until it has grown children of
    its own to learn from), times its learned chance that the child lives to grow up. Once
    the child gives back enough that the real tie weight is larger, the real one takes over.
    The same expected value is the return side of the conception decision. (The alternative
    set aside: a literal long build, where feeding raises the child's chance of surviving
    and the parent values that chance.)
  - **Chris's expectation, to test, not to write in:** "once we have households with children
    we might find bands have weaker bonds outside of households." Measure: tie structure
    within bands (§4.10), tracked from before births so the change is visible.
- ~~A household decides~~ (2026-11-04: the parents decide, above; the ROI terms stand)
  **The return counts belonging too (Decided — Chris, 2026-11-04):** "yes count belonging
  too." What a child gives back is its gifts, its help at tasks, care in old age, and the
  belonging its bond meets (a grown child is a strong tie, §2 Needs). Each parent's value of a
  child is a learned value (habit from its own children, norm from what others tell, §4.4),
  from a prior until anyone has grown children. Noted (Claude): belonging
  gives children a value that does not depend on material flows, so fertility has a floor
  under any economy; this softens, without removing, the test of Chris's Caldwell hypothesis.
  - **The prior is built from the agent's own experience, not set as a number (Decided —
    Chris, 2026-11-05, on Claude's proposal):** "yes." Until it has habit or norm, a parent
    values a child by what it can already see: the bond (what its strongest ties give it now,
    in gifts and belonging, since a grown child is a strong tie), the help (a child's hours
    from 6 at its own work rates), discounted by the deaths it has seen. Rich ties and good
    yields expect more from a child than isolation or hunger; expectations differ by history.
    A set number would either end the colony (too low) or write in the birth rate (too high).
  Whether a child is worth the investment is judged by **ROI**: a few years of
  dependence (care hours, food) against labor contributed until the child leaves to found a
  household, plus old-age care.
- Children are insurance for the household. Chris's hypothesis: this breaks down when labor
  becomes a commodity the individual sells rather than a resource the community spends
  (cf. Caldwell's wealth-flows theory, 1976). Should emerge, not be written in.
- **Population size is endogenous** (Decided; reworded from "population grows" after the
  audit, which read it as an imposed outcome). The Malthus-vs-hoarding comparison in §1 depends on births
  responding to the ROI rule, not to a fixed rate.

#### The life cycle as built in Stage 6 — Default (Claude, 2026-11-06; `life.js`, numbers in `PARAMETERS.life`)
Chris decided the stages, ages, consent, conception, fertility, care as investment and the
weight (§2, above); the rest are Claude's proposals:
- **A child with a carer does not plan.** Each day it is where its carer was, shares its fire
  and bed (its warmth is the carer's; it takes no bed of its own), and eats what it holds,
  which is what it is given. It does not barter. It meets and hears chat, so it learns norms
  before it lives a season (fix 2's point); adults do not spend chat on it, since it has lived
  nothing to tell.
- **Children drink and eat on their own once old enough (Decided — Chris, 2026-11-16):** "we
  need children to be able to take care of their own needs after some age. the act of
  drinking and eating should be something children do on their own (with their mother if they
  still are following her) once old enough." A child eats what it holds (it already did).
  - *As built — Default (Claude, 2026-11-16):* a child shares its carer's drinking, as before
    (her evening water, her gourd included), and from weaning (`nurseAge`) it also drinks for
    itself at water anywhere it was that day with her, camp included, whether or not she
    drank. An infant's water stays its nursing carer's (milk). (A first build dropped the
    sharing; in exp006 s1, 13 weaned children of 2–4 died of thirst while their carers lived,
    since a carer drinking from her gourd at camp drank alone.) (Until 2026-11-16 a child drank
    only where its carer drank. In exp005 all 22 children who died of thirst died on the same
    day as a woman of 26–45; in s1, traced, each was her child, at a camp beside water, and she
    was too hurt to drink.)
- **A hurt carer puts her own recovery first, without letting her children die (Decided —
  Chris, 2026-11-16):** "injured care givers should probably prioritize their own recovery
  over their children, while not letting children die too."
  - *As built — Default (Claude, 2026-11-16):* care never takes the hours a carer needs to
    drink (her drink trip); the care her hours cannot cover lapses, as rest it would have cost
    her. Her children drink on their own (above), are given food from her hold and by her ties
    (exchange takes no hours), and an infant lives on her milk. (Before, a minor injury left a
    mother of three or four 0.2 h or less after care, short of the 0.25 h a drink takes at her
    own camp's water; a scratch check of exp005's s1 colony, `probes/thirsttrace.mjs`, not a
    registered experiment, found this in all four of its families dead of thirst.)
- **Infants live on milk.** An infant's food is its nursing carer's food level; she eats a
  quarter more per infant. Late in pregnancy (the last 90 days) she eats 15% more and has 2
  hours a day fewer. An infant with no nursing carer has no milk and starves.
- **Care is hours from the carer's rest:** 2 a day for an infant, 1 for a child under 6,
  0.5 for an older child, taken off the carer's capacity.
- **A child's food need** rises from 0.4 of an adult's at 2 to all of it at 15. **Its work
  rate** rises from 0.25 at 6 to 1 at 15: from 6, when its carer gathers, it gathers beside
  it bare-handed at that rate, and the haul is the carer's.
- **The bond through the normal channels:** each day of care is a kind offer in the child's
  tally and kindness given in the carer's; each day of help is a kind offer in the carer's
  tally and kindness given in the child's. Familiarity (§2) keeps both for decades.
- **Gifts to children.** A parent gives to its child by its weight on the child (the
  Decided rule above); it stays out of the owing balance. Anyone else gives to a child as to
  its keeper (its mother, or whoever took her place): by the tie to the keeper, booked as a
  gift to the keeper. **A child's need, to a giver, is its coming days on what it holds**
  (Decided — Chris, 2026-11-14: "project the child's need over the coming days"): tonight's
  evening, then its coming days, eating the food it holds as it needs it and with nothing
  coming in, since it neither gathers for itself nor plans. So a child with nothing in hand
  shows its whole road to death, and every projected day it is dead costs the worst, as in
  anyone's projection. As built (Default, Claude, 2026-11-14): one day at a time, at the
  giver's discount, to the projection's far horizon (a year), its other needs held at
  tonight's. Day by day, because with nothing coming in a day's food moves its death by a
  day; in the projection's weekly steps a child near the brink died in the first week with or
  without it, so a day's food gained it nothing (a scratch check: 8 children dead of hunger
  in 36 days). A
  gift is the receiver's whole shortfall or, if that does not pay the giver, a day's food.
  (History: from 2026-11-06 a child's need was its evening alone, with a night that kills it
  at the worst cost. That fix cut year 4's child deaths from 33 to 2 in a reloaded year-3
  colony, but exp003 found the giver's sum lopsided: her loss counted over months, the
  child's hunger over one evening squeezed below zero, so above the brink a day's food paid
  her about one day in ten. More than half of all child-days were spent hungry, while the
  carer held a day of the child's food about 9 days in 10.)
- **What a woman expects of a father** is the food his gifts have brought her and her child
  (a new per-tie record, fading with the tally).
- **The chance a child grows up** is learned from the children seen: one's own, and those of
  anyone one has a tie to. It is learned as a death rate per year of childhood watched (each
  child seen counts each year it lives), from a prior of 1 death in 52 child-years (3 in 4
  grow up), and read as the chance of living 15 years at that rate. (First built as grown ÷
  (grown + died): in the first 15 years no child can have grown, so the estimate counted only
  deaths, fell to 0.15–0.23, and births stopped after year 5 in all three 15-year runs. A
  child still growing counted for nothing. Fixed 2026-11-06.) **What a grown child is worth**
  is learned at each of one's own children's maturity, as one's tie weight on it.
- **The return on a child, in hours** (§4.3: costs are in hours). For either parent: the
  bond, judged by the strongest tie now (the food its gifts bring a day, at the parent's hours
  per unit of food, plus the belonging it meets, at the steepest hour value of rest), over the
  years the parent expects to live once the child is grown (the old-age hazard), times the
  chance the child grows up. For the mother, also the child's help from 6 at her usual working
  day, times that chance; and her costs: late pregnancy, nursing, care hours and the child's
  food to 15, less what she expects the father to give over those years (capped at the
  costs). The father carries no costs, so his return is positive whenever he has a bond.
- **Conception** is weighed on the first day of each month by every woman free to conceive,
  with every fertile man at her camp she trusts.
- **A child passed on** (when its carer dies) goes to the adult it is most strongly tied to
  among the willing: an adult whose weight on the child is above zero, by its own tie, as a
  parent, or through its tie to the child's keeper. An infant goes only to a woman nursing an
  infant of her own. A child of 6 or more with no one willing joins the camp and plans its own
  day at a child's rate; a younger one stays where it was and lives on gifts.
- **At 15** it takes a bed at its carer's camp and plans its own days.
- *Not yet built:* the mother handing a child from 10 to another adult each morning
  (apprenticing out).

#### Planning together as built in Stage 6 — Default (Claude, 2026-11-06; `planner.js`)
The Default above (§7.6 Households plan together), as built: each morning the adults plan in
a random order. Before planning, each counts what each tie at its camp has already announced,
times its learned value for that tie, as goods held tonight; after planning, it announces
what its route expects to gather. The value per tie is learned each evening, by one
error-driven update from a prior of 0, as the share of the tie's announced haul that came
back to it that evening as gifts or in barter (units, capped at all of it). It is a habit
only; nothing is told about it yet. A prior of 0 means no one counts on anyone until a tie
has brought something back.
- *Result, bands, seed 1, 150 days:* about a quarter of planners count some tie's haul; the
  shares are small (median under 0.01, the top tenth about 0.02, the largest 0.2), since most
  of a haul is the gatherer's own food. Whether it becomes the division of work Chris
  described ("i'll get food, you get wood") is for the generation runs to show.

### 7.5 Death and inheritance (Decided)
- **Foundation: everything stays where it lies (Decided — Chris, 2026-11-02).** A dead
  agent's holdings stay at the place they are, under open access: whoever finds them may use
  them. Anything beyond that is a **tradition**. So goods stored at a household's shelter
  pass to the people who live there by location, not by a rule naming heirs.
  - *As built, Stage 6 — Default (Claude, 2026-11-06; `world.js`):* a dead agent's goods
    stay in the dwelling it slept in (a child's, in its carer's), and the first to sleep
    there after takes them all. A dwelling no one sleeps in keeps them until someone does.
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
  - ~~**Mechanism — Default:** sequential best response. One member plans; the next plans
    knowing that route; order random each day.~~ (Replaced 2026-11-04, below.) Cost: about
    one individual plan per member, where a truly joint search would multiply the route
    spaces (thousands × thousands).
  - **Planning together among strong ties — Default (Claude, 2026-11-04; Chris decided the
    emergent household it serves, not this mechanism in detail):** at camp each morning, in a random order, each agent plans its day and
    announces what it expects to bring home. Those planning after count their ties'
    announced hauls as goods coming in tonight, weighted by a learned value per tie (habit,
    norm and arbitration, §4.4): how much of that tie's announced hauls has actually come back
    to them as gifts or swaps. The swap is the evening's existing exchange at camp. No
    threshold and no household entity: the planning group is as wide as trust reaches, up to
    the whole band. Division of work ("you get food, I'll get wood") is a result.
  - **Ties outside the household (Decided — Chris):** an agent anticipates a tie's route
    from its model of that particular other (yesterday's habit), and values gifts to that tie
    accordingly. The difference between household and tie is information: a household shares
    today's plan, a tie is predicted from the past. (2026-11-04: with planning together graded
    by trust, ties at the same camp share today's announced hauls; ties elsewhere are still
    predicted from habit.)
  - Chris's summary: planning is **noisy pathfinding**, a shortest path through a world partly
    known (norms, chat) and partly predicted (ties' habits).

#### One agent's day as built in Stage 2 — Default (Claude, 2026-11-02; numbers in `params.js`)
Stage 2 had to fill gaps the design left open. Each is a Default awaiting Chris's review.
- **Need levels.** Food and water are levels that run down daily (food also by hours worked)
  and can fall below 0, a hunger or thirst debt, so a starving agent still values a small
  meal. (Until 2026-11-03 the debt stopped at -1 and death counted days at or below zero;
  now the debt runs down the body's reserve, §2 Needs.) Warmth (shelter base + fire, scaled by the season's cold) and rest (free hours
  against a set point of 6) are worked out each evening in [0, 1]. Cost = Σ deficit², with
  belonging held at its set point until there is anyone to tie to.
- **Death.** The reserve gone: 20 days' food or 3 days' water owed (§2 Needs), or more than 5
  days at zero warmth; old age by a Gompertz hazard, with working hours declining after 50.
- **The evening.** Drink (at the source, or from the gourd), light a fire whenever there is
  the wood, eat cooked food (×1.5) to the set point, rest. Wild plant food rots 1% a day
  (nuts and roots keep), so autumn stores carry into winter.
- **Keep, as built.** The value of what is held at dark is the discounted need cost of the
  next 20 days living on it with no gathering (daily discount 0.97, swept).
- **Perception and habits (§4.4).** An agent sees the hex it stands in and its neighbours:
  which resources are there and how full they look. It remembers each sighting and grows
  less sure of it with age (the curiosity term makes that uncertainty optimistic, so stale
  hexes get looked at again). Its habit is, per activity, how much it gathers in an hour
  from a full hex, learned by one error-driven update. Expected yield = that rate × the
  fullness it last saw. (A first version learned yields per hex blind; agents kept going
  back to hexes they had stripped while full ones nearby went unused.)
- **Planner search.** Candidate stops are hexes within half a day's capacity; they are ranked
  by a one-stop day and the best 4 of each activity kept (ranking all together let the most
  pressing need crowd out the rest), then the route is built greedily up to 3 stops.
- **Drinking.** From a river or spring hex, or from the shore of a lake.
- **Scouting.** Walking to the nearest unseen hexes, valued at a small bonus per hex revealed.
- **Starting.** 15 units of food in hand (a burn-in scaffold, §5); homes chosen at random on
  land within a hex of water (a Stage 2 test setup; the band layout is Stage 7).
- **Homes are fixed (shelved).** Agents whose homes are hemmed in (forest, few hexes within
  reach) starve alone in late winter. Moving camp was proposed and shelved: that may be what
  reciprocity should rescue.
- **Balancing (Decided — Chris, 2026-11-02): humans are not solitary.** Numbers are never
  balanced so that a lone agent survives; that leads away from the goal state (§1: individuals
  mostly meet their needs through the economy). Stage 2 tests mechanics only. The numbers
  raised to get loners through winter (plant yields and regrowth, slow rot) are provisional,
  to be set again against the foundation forming.

#### Meeting, chat and balancing as built in Stage 3 — Default (Claude, 2026-11-02)
- **Bands from the start.** The §5 layout (bands a day or two apart, nearness only) is used
  from Stage 3, since exchange needs neighbours: default 5 bands of 20, centres ≥ 14 hexes
  apart on land beside water, homes within 2 hexes of the centre.
- **One camp per band, tried and set aside (2026-11-03).** Chris proposed putting a band's
  homes in one hex, which fits the scale (an hour's walk across). In the test (bands, seed 1)
  20 agents who cannot move camp stripped the plants within a hex of it to 0.30 of full by
  spring (0.58 with homes spread over 2 hexes) and 31 died of hunger in year 1 (11 spread).
  Homes stay spread over 2 hexes; how bandmates meet at home is open.
- **Meeting.** Agents in the same hex on the same day meet, home in the evening included.
  Each sees what the others gathered there (passive, no cap) and chats with up to k = 5 of
  those met, chosen at random (ties first once ties exist). A chat passes on where the other
  went, what it got and how full those hexes were; the listener updates its norms and takes
  any newer sighting.
- **Norms and arbitration (§4.4).** A norm is the rate others get from a full hex, pooled by one
  error-driven update from what is seen and told. The rate used in planning weighs the
  agent's own habit (by experiences, capped at 20) against the norm (weight 3).
- **Balancing against the foundation, not the loner.** Wild plant stocks ×10 (plains 400 a
  hex): a band of 20–25 foragers ranges over roughly 30–55 hexes, so a hex must feed about
  half a person a year; at the old numbers bands of 20 starved within months. A winter growth
  floor of 0.2 stands in for the winter food tree v0 leaves out (hunting, fishing, roots).
- **Keep, revised.** The Keep projection runs 120 days in weekly steps at a 0.99 daily
  discount and assumes ordinary gathering (3 h foraging, 1 h wood a day) at the yields the
  agent has learned for each season (§7.6: expected future need from seasonal norms). A store
  is worth what it covers beyond that. (Assuming no gathering made agents hoard ~800 units
  and work 13-hour days.)
- **Result, 5 bands × 20, seeds 1–2:** about three-quarters come through the first winter
  (the losses are learning what winter is), then no deaths in years 2–3; 7–9 hours worked;
  rest mostly met.

#### Exchange and ties as built in Stage 4 — Default (Claude, 2026-11-02; code in `exchange.js`)
The decided rules (§2 Ties and Owing, §3 phase 3, §4.7, §7.1, §7.2) are built as written. The
gaps filled:
- **Goods traded:** food and wood (water stays in the gourd). Price = food per wood.
  (Superseded: every good in the tree is traded since 5a, and water since 2026-11-03, §2.)
- **Where:** at every hex where agents met today, places in random order: gifts first, then
  barter rounds.
- **Own limit, hours adjusted by need (§7.2).** The ratio of the marginal value of wood to
  that of food in the agent's own cost (tonight plus Keep), with plain hour costs (its best
  known source, trip included) as a small baseline when its needs are flat in both. Hours
  alone could not move price with supply and demand.
- **Estimate of the other's limit:** the particular other if it has traded with it before
  (its past deal prices), else cost norms (others' rates).
- **Quantity:** lot by lot (a tenth of the seller's stock) while both still gain by their
  own need, up to 30 lots.
- **Kindness (§2 tally):** a completed barter counts `tradeWeight` = 0.5 (mutual gain;
  swept including 0); a price at least as good as the agent's own fair middle counts 1; a
  gift received counts 1. Tallies fade over ~60 days.
- **Gifts (§7.1, Give arm of §7.6).** A tie (trust > 0) gives to one in need (short of food
  for tonight, or of wood for a fire), strongest ties first, when giving lowers its own cost:
  the belonging it gains outweighs the goods. Not when the recipient's unreturned gifts have
  reached 3 (a grudge).
- **Belonging:** each tie counts the smaller of kindness received and kindness given (trusting
  and being trusted); 5 such units meet the need.
- **Owing:** gift occasions, given minus returned, shrinking at the agent's own forgetting rate
  (1% a day, the expected value of the daily chance).
- **Trade in the plan:** the Trade arm lets a quarter or half of one good be swapped at the
  going rate, discounted by how reliably the agent's trades have come off (one reliability
  per agent, not yet per place).
- **Result, bands, seed 1, a year from no ties:** 755 barters (first on day 3), 1,203 gifts
  (first on day 5), 83 trusted ties, mean belonging 0.87. Barter peaks in autumn and winter;
  by year 2 gifts have replaced barter within bands. Controlled market: wood sells for 1.21
  food with 2 sellers to 8 buyers, 0.77 at 5:5, 0.64 at 8:2.

#### Stone tools and many goods as built in Stage 5a — Default (Claude, 2026-11-02; `tree.js`)
- **The tree as data.** Tools, recipes and traded goods live in one file. Stage 5a holds the
  stone axe (wood ×2) and pick (quarrying ×2), each from 2 flint + 1 wood + 3 hours at home.
- **A tool is held as remaining life:** 1 when new, minus 1/80 per hour of use; traded whole.
  Agents learn the bare-handed rate (yield ÷ tool), so a tool's worth is known from the recipe.
- **Flint is quarried** from deposits in the hills **and from cobbles on some riverbanks**
  (10% of bank hexes). Hill-only flint lay 5.5–11 hours from every band and no tools were made;
  knappable stone in river gravels is the realistic common case.
- **Keep with tools:** the projection's wood-cutting runs at the axe's rate while it lasts;
  with no axe and the inputs in hand, the agent is assumed to make one (so flint is worth what
  an axe is worth).
- **Exchange over any goods:** every pair has its own going rate (§7.2), own limits are
  marginal values in the agent's own cost for each good, the other's limit is estimated from
  the particular other or from norm hour costs (a made good: recipe hours + inputs).
- **Result, bands, seed 1, two years:** 14 tools made, up to 7 axes held at once (winter, when
  wood is cut most), worn axes remade; 82 trades in flint, 6 axes sold for food; 89/100 alive
  (up from ~75 before local flint). Tools stay rare at levels 0–1, where they only speed
  wood-cutting; they are expected to matter with huts and farming (5b).

#### Pots, huts, tinkering and know-how as built in Stage 5b — Default (Claude, 2026-11-03; `tree.js`, `planner.js`)
Farming waits on a design question (who may harvest a planted field under open access).
- **Clay** is dug from riverbank hexes (a deposit, as placed in Stage 1), 3 units an hour by hand.
- **Pot (water level 2):** 2 clay + 3 wood + 3 hours at home. It holds 2 need-units of water
  beside the gourd's 0.5, so one trip lasts about five days, and it breaks at 1/300 a day.
  Its worth is the trips to water it saves.
- **Hut (shelter level 2):** 20 wood + 6 clay and 40 hours of work by hand, inputs used in
  proportion to the work. An axe, if held, doubles the work and wears, as a tool is a multiplier
  (§2 Tools), not a gate. (First built as needing the axe: nobody held one in summer, when
  there is time to build.) Insulation 0.8 against the lean-to's 0.45, and **no warmth until
  finished**. A finished hut wears 0.2% a day and is repaired by the same work; an unfinished
  one weathers 0.3% a day, and one that weathers to nothing counts as abandoned.
- **Partial projects (§7.6, Decided), as built:** a part-built hut is worth the finished hut's
  value × the share of its total hours already in hand × the agent's learned chance of
  finishing. The finished value is what the Keep projection gives a hut today. The total hours
  are building plus getting the inputs at the agent's own hour costs. "In hand" is the
  progress so far plus clay held toward the rest. The chance of finishing is finished ÷
  (finished + abandoned), with a prior of 2 finished. Every hour put in is worth the same share in any season, so
  agents put hours in when hours are cheapest to them. (Two earlier versions failed. One had
  the projection keep building at a steady pace, so tomorrow always looked as good as today
  and agents put it off until autumn. One spread the remaining work over the horizon, which
  didn't fix it, because today's work burns stores the projection's idealised future doesn't.)
  Wood is not counted toward the share, because it is fuel too and the Keep arm already values it.
- **Keep, changed:** the projection now counts rest. Its working day is the agent's own learned
  hours by season, apart from drinking and making, plus its trips to water. It assumes the
  agent makes a known `keep` good (axe, pot) once the inputs are in hand. In the projection's
  7-day lumps, the fire burns on the share of days the wood covers. (All-or-nothing, 13.6 units
  meant no fire for a week and 14 a fire every night, which made values jump.) Tonight's fire
  stays all-or-nothing: making it partial changed the Stage 4 market results.
- **Tinkering (§7.3), as built:** an activity of 2 hours at home or at one of the 3 nearest
  places with clay or stone. A level can be found only if all its inputs are at hand (goods
  held, or resources in the hex) and its tool is held: the pot needs clay and wood, the hut
  clay, wood and an axe. Each hour gives each such level a 0.3% chance. The planner scores
  tinkering by the curiosity term: the discoveries the agent expects × 0.02. Its expectation
  comes from its own record of discoveries per hour per material at hand, with a hopeful prior
  (1 per 20 material-hours) that fruitless hours wear down. It cannot know what is left to find.
- **Know-how (§7.3), as built:** a set of recipes per agent, starting with stone and fire (axe,
  pick, lean-to; §5). It grows by tinkering and by seeing. Anyone in the same hex the same day
  as someone who practised a craft there (made or built it) has a 30% chance of learning it.
  It is kept for life, with no separate forgetting rule. So a craft is lost exactly when everyone
  who knows it dies without anyone having watched them practise. With births (Stage 6) that
  is "nobody practises it for a generation".
- **Result, bands, seed 1, two years, nothing given:** 12 pot discoveries by tinkering and 5 learned by seeing (one chain 32 → 28 → 21 → 20); 19 pots made, 16 agents know the pot at the end; the hut was never found (it needs an axe in hand at a clay bank, with wood); 57 axes made and 128 trades of food for axes (5a: 14 and 6; the smoothed projection fire makes every unit of wood count); 11,032 hours tinkering; 87/100 alive (5a: 89). **With the hut and
  pot known from the start** (as if discovered), to day 240: 200 huts started and 41 finished, most of
  them in late summer and autumn, ahead of the cold; 43 pots made; 98/100 alive. Crafts are practised at home,
  and few agents share a home hex, so know-how spreads slowly by seeing. Households (Stage 6)
  should change that.
- **Ledger check:** recipes, inputs and the chance per hour are the tree (data). Who tinkers,
  what they find, who learns by watching, and who builds when all come from each agent's own
  plan and meetings. No rule names who knows what.

#### Calibration of the Keep projection and the route search — Default (Claude, 2026-11-03; `planner.js`)
Chris asked for calibration before farming. What was found and changed:
- **Huts do warm; fires are rare.** In winter, agents in a hut averaged warmth 0.79 against
  0.55 under a lean-to; fires were lit on 16% of winter evenings (agents came home with about 1.2
  wood, a fire takes 2). The deaths were from hunger, not cold.
- **The projection was rosy about food.** It assumed 3 hours of foraging a day at the learned
  yield: 10–12 food a day against the 5.4–5.9 agents actually gathered, so stores looked cheap.
  **Now (§7.6: expected future need from seasonal norms)** each projected week brings in what
  the agent's days have brought in that season. That is food and wood gathered (wood
  bare-handed, so an axe still adds its share) plus the net gained or lost in exchange,
  learned slowly (5% a day). Projected and lived now agree within about 0.3 a day in every
  season.
- **A food gap fades in the projection.** With inflows that just cover the day's need, tonight's
  hunger was carried unchanged for months (about 100 cost units). Food then outweighed even a
  lethal thirst, and agents died of thirst beside water. Now each projected week starts with
  half the gap between where the agent stands and its usual evening food level for the
  season (learned the same way). That stands for "a hungry agent forages more, a full one
  less". **Open for review: the half per week is a set number** (`keepPersist` 0.5). It could
  be learned from the agent's own weeks.
- ~~**Agents know a need can kill.**~~ **Replaced 2026-11-03 by Chris's rule (§2 Needs: below
  zero, the scale runs to death).** The 1000 patched a measure in which water one day from
  death cost the same as food two weeks from it. Result with the new scale and the lost days
  priced (bands, seed 1, two years): 88/100 alive, no thirst deaths (11 hunger, 1 old age);
  evenings at or below zero water 0.48% (from 0.95%); runs of three dry evenings, the last
  one before death, 15 (from 37). The 83 evenings two or more days dry were nearly all on
  13.5-hour days with food at about 0.2: hungry agents in autumn, winter and spring on long
  food trips that leave no hours for a 3-hour drink. What it was: a plan that would make tonight one more day at or below
  zero than the need allows (§2 death rule) costs 1000, far above any other plan. So an agent
  pushes thirst to the edge but drinks before it dies. It also enters the dying agent's own
  limits in barter: one food short of dying values food enormously and bids high for it. It
  does not enter a giver's choice (a gift weighs only the giver's own costs). (Corrected
  2026-11-03: an earlier line here said a gift to a dying tie was worth a great deal to the
  giver; the code never did that.) **New rule, for Chris's review.** Before it, 7–10 of 100 agents
  died of thirst in two years by trading one more dry day for food, morning after morning.
- **Route search.** The shortlist keeps, per activity, the best stops by gain and the best by
  gain per hour of the day they take. The route is then built greedily twice, once by most
  gain and once by most gain per hour, and the better route kept. Each order alone failed: by
  gain, a far stop filled the day first and nothing else fit (80 of 99 checked thirsty
  mornings missed a better plan with a drink); by gain per hour, cheap poor work near home
  filled the day so a good trip no longer fit.
- **Speed.** The projection loop now runs on plain numbers, with each week's season looked up
  once a day. Same results, 4.5× faster (2.58 → 0.57 ms per agent-day). With both searches:
  0.69 ms in bands runs, 0.37 in the smoke measure.
- **Result, bands, seed 1, two years:** 87/100 alive, all 13 deaths hunger in the first autumn
  and winter (agents still on the prior's plenty), none in year 2, none of thirst. With the hut
  known, 56 huts finished by day 240. Winter warmth 0.71 (0.81 in a hut) against 0.56 without
  hut know-how. Smoke: all 36 checks pass. The first barter now comes on day 49, not day 3.
- **Ledger check:** what agents expect is their own lived seasons; the lethal-night cost is
  about the agent's own death, not an economic outcome. No rule names who stores, trades or
  survives.

#### Farming as built in Stage 5d — Default (Claude, 2026-11-03; `tree.js`, `agent.js`, `world.js`)
Decided by Chris: anyone may harvest a planted field, and what comes back to the planter
through others counts (§2). The rest are Claude's proposals:
- *Superseded in Stage 5g (§2, As built, Stage 5g): wild grain is now the seeds crop of grass
  land in summer, plants are greens, roots and nuts, and fields take land.*
- **Wild grain first.** Foraging on plains in summer brings in some wild cereal along with the
  plants (15% of what is gathered there). That is where the first seed comes from.
- **Farming is a level found by tinkering**, with grain in hand at a hex with fertile land.
  The stone hoe and sickle are known from the start (§5).
- **Fields.** Sown in spring only, at 4 seeds an hour by hand (the hoe doubles it), on plains or
  hills (forest needs clearing first, not built yet). A field ripens on day 150 of the year
  (late summer) with 10 grain per seed × the soil's fertility (its stock ÷ 12). Sowing draws
  0.02 soil per seed, and soil recovers slowly (the existing soil resource). Ripe grain decays
  1% a day in the field, and what is left on day 240 is lost.
- **Reaping** takes ripe grain from any field in the hex, the reaper's own first, at 8 grain
  an hour by hand (the sickle doubles it). Agents see ripe grain like any other resource
  (§4.6). Whose field each reaper took from is recorded.
- **The planter's return (Chris's rule, as built).** When a field closes, its planter learns
  how much grain came back per seed sown: what it reaped itself, plus grain gifted to it by
  anyone who reaped that field (up to what each reaped there). Trades do not count, since the
  planter paid for that grain. The planter learns this by one error-driven update, per seed
  at full fertility, from a hopeful prior of 8 (about 4 on ordinary land). Planning values sowing at that learned return; a field it
  sowed earlier counts as grain arriving at harvest, less the hours of reaping.
- **Grain as food (food level 2).** It restores 0.10 a unit (plants 0.08), and 1.5× when
  cooked with fire in a pot. It keeps (0.2% a day against the plants' 1%). Plants are eaten
  first, since they rot faster. Grain is a good like any other in barter and is given as food in gifts.
- **The projection now reaches a year.** It runs 120 days in weekly steps, then to 360 days in
  monthly steps, because farming's cycle is a year. From autumn, the 120-day projection could
  see neither next spring's sowing nor the harvest after it, so grain's only use was food:
  all the wild grain was eaten by spring, and no one ever sowed. As with the axe and the pot,
  grain still held at the spring sowing (day 30) is assumed sown, on the best farmable land
  within 2 hexes of home, and comes back at the agent's learned return at the ripening. A
  discount of 0.997 a day instead of 0.99 made little difference to this, so the discount is
  unchanged.
- **Candidates are ranked without the trade arm** (five times cheaper). The route is still
  built and chosen with it.
- **Result, bands, seed 1, three years.** Nothing given: farming discovered 44 times by
  tinkering (first on day 100) and 6 times learned by seeing. The first sowing came in the third
  spring (4 seeds); in year 3, 31 seeds were sown and 274 grain reaped; the next spring, 54
  seeds. With farming known from the start: 115 seeds in year 3 gave 1,032 grain. Food stayed
  at 0.98–0.99 through that autumn and winter, against about 0.8 before farming. Grain changed
  hands about 3,000 times. The return through others is small so far (a few grain).
- **Not yet:** bread (quern, clay oven), wells, clearing forest for fields, tending.
- ~~**Do fields take land from wild plants? (Open — raised 2026-11-04.)**~~ (Settled
  2026-11-05 by plant kinds sharing a hex's land, §2 Landscape and resources.) As built, plants and
  soil are separate stocks in a hex: sowing draws soil only, foraging draws plants only, and
  there is no land area, so farming is pure addition to the wild harvest. Proposed (Claude): a
  hex has a fixed amount of land; a field takes land in proportion to its seeds out of the
  hex's wild-plant cap while it stands, and wild plants regrow from the floor when it closes.
  Clearing forest would do the same against wood. Folded into Stage 6, since growth is what
  makes it bind.

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
11. Household as formal unit → **resolved** (stated in §4.2); reversed 2026-11-04: households
    are emergent (§2).
12. Currency's difference from durable goods → **resolved** (§1: general purchasing power).

---

## References
- Brown, J. K. (1970). A note on the division of labor by sex. *American Anthropologist* 72(5). (compatibility with child care)
- Caldwell, J. C. (1976). Toward a restatement of demographic transition theory. *Population and Development Review* 2(3–4). (wealth-flows theory)
- Cline, E. H. (2014). *1177 B.C.: The Year Civilization Collapsed.*
- Daw, N. D., Niv, Y., & Dayan, P. (2005). Uncertainty-based competition between prefrontal and dorsolateral striatal systems for behavioral control. *Nature Neuroscience* 8.
- de Waal, F. — reciprocity in chimpanzee grooming and food sharing.
- Emerson, R. M. (1962). Power-dependence relations. *American Sociological Review* 27(1).
- Sahlins, M. (1972). *Stone Age Economics.* (the spectrum of reciprocity by social distance)
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
