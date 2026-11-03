'use strict';
// The recipe tree as data (ODD §2 First tree v0). Stage 5a: the stone tools. Stage 5b: clay,
// pots and the hut. Farming and metals join later.
//
// A tool is a multiplier on production for its task (ODD §2 Tools). It is held as remaining
// life: a new tool is 1, and each hour of use takes 1/life off it. Starting know-how (ODD §5,
// Decided) is stone and fire: the stone tools and level 1 of each ladder (the lean-to).
// Level 2 on must be discovered by tinkering (ODD §7.3).

// tasks a tool can speed, by activity
var TOOLS = {
  axe:  { act: A_WOOD,   mult: 2, life: 80 },   // cutting wood
  pick: { act: A_QUARRY, mult: 2, life: 80 },   // quarrying flint (and later ore, wells)
  hoe:    { act: A_SOW,  mult: 2, life: 80 },   // sowing (Stage 5d)
  sickle: { act: A_REAP, mult: 2, life: 80 },   // reaping
};
// the tool that speeds each activity, if any
var TOOL_FOR = [];
for (const t in TOOLS) TOOL_FOR[TOOLS[t].act] = t;

// recipes for goods made at home: inputs consumed, hours of work, level on its ladder.
// `keep`: the Keep projection assumes it is made when the inputs are in hand (ODD §7.6), for
// goods whose use the projection models (the axe cuts projected wood; the pot saves projected
// trips to water).
var RECIPES = {
  axe:  { inputs: { flint: 2, wood: 1 }, hours: 3, level: 0, keep: true },
  pick: { inputs: { flint: 2, wood: 1 }, hours: 3, level: 0 },
  hoe:    { inputs: { flint: 2, wood: 1 }, hours: 3, level: 0 },
  sickle: { inputs: { flint: 2, wood: 1 }, hours: 3, level: 0 },
  // water level 2: a clay pot, fired in an open fire (ODD §2 v0: carried and stored in a pot)
  pot:  { inputs: { clay: 2, wood: 3 }, hours: 3, level: 2, keep: true },
};

// structures built at home over one or more days (ODD §7.6 partial projects). Inputs are
// used in proportion to the work done; `hours` is the work by hand, and `tool`, if held,
// multiplies the work (ODD §2 Tools) and wears by the hour. A lean-to's warmth grows with the
// work; a hut gives warmth only once finished.
var BUILDS = {
  leanTo: { inputs: { wood: 10 }, hours: 4, level: 1 },
  // shelter level 2: poles (cut faster with an axe), clay daub, a hearth (ODD §2 v0)
  hut:    { inputs: { wood: 20, clay: 6 }, hours: 40, level: 2, tool: 'axe' },
};

// what every agent knows at the start (ODD §5)
var START_KNOWHOW = ['axe', 'pick', 'hoe', 'sickle', 'leanTo'];
// what tinkering can find, and what each needs at hand: goods held or resources in the hex,
// plus the tool (ODD §7.3: the chance of finding a level depends on holding its inputs)
var DISCOVERABLE = {
  pot: { needs: ['clay', 'wood'] },
  hut: { needs: ['clay', 'wood'], tool: 'axe' },
  // food level 2: sowing grain (Stage 5d); 'soil' is fertile land in the hex
  farm: { needs: ['grain', 'soil'] },
};

// goods that change hands (water stays in the gourd or pot); the index orders each pair for prices
var GOODS = ['food', 'wood', 'flint', 'axe', 'pick', 'clay', 'pot', 'grain', 'hoe', 'sickle'];
// goods traded whole, one at a time
var WHOLE = { axe: true, pick: true, pot: true, hoe: true, sickle: true };
