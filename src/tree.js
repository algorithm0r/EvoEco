'use strict';
// The recipe tree as data (ODD §2 First tree v0). Stage 5a: the stone tools. Stage 5b: clay,
// pots and the hut. Farming and metals join later.
//
// A tool is a multiplier on production for its task (ODD §2 Tools). It is held as remaining
// life: a new tool is 1, and each hour of use takes 1/life off it. Starting know-how (ODD §5,
// Decided) is a setting, PARAMETERS.agents.knowhow: by default the stone tools only (fire needs
// no know-how), and every level on a ladder must be discovered by tinkering (ODD §7.3).
// Stage 5g adds the processing of foods.

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

// processing (ODD §2 Plant kinds, Stage 5g): work at home that turns a food into another with
// other properties (tree's GOODS entries in params.js). Per hour, `perHour` units of `from`
// become `ratio` units each of `to`; `wood` is burned per unit taken (a fire), and `tool`, a
// good held, is needed but not used up (a grinding stone)
var PROCESSES = {
  drying:   { from: 'greens', to: 'driedGreens', ratio: 1 / 3, perHour: 12 },      // keeps
  roasting: { from: 'nuts', to: 'roastedNuts', ratio: 1, perHour: 10, wood: 0.1 },  // keeps, a little more food
  grinding: { from: 'grain', to: 'meal', ratio: 1, perHour: 4, tool: 'flint' },     // more food, no pot to cook it
};

// what tinkering can find, and what each needs at hand: goods held or resources in the hex,
// plus the tool (ODD §7.3: the chance of finding a level depends on holding its inputs)
var DISCOVERABLE = {
  // shelter level 1 (ODD §5: no tech level known by default)
  leanTo: { needs: ['wood'] },
  drying: { needs: ['greens'] },
  roasting: { needs: ['nuts', 'wood'] },
  grinding: { needs: ['grain', 'flint'] },
  pot: { needs: ['clay', 'wood'] },
  hut: { needs: ['clay', 'wood'], tool: 'axe' },
  // food level 2: sowing grain (Stage 5d); 'soil' is fertile land in the hex
  farm: { needs: ['grain', 'soil'] },
};

// the foods (ODD §2 Plant kinds, Stage 5g), in the order they are eaten: fastest-rotting first
var FOODS = ['greens', 'grain', 'roots', 'nuts', 'driedGreens', 'roastedNuts', 'meal']
  .sort((a, b) => PARAMETERS.goods[b].rot - PARAMETERS.goods[a].rot);
// goods that change hands (water stays in the gourd or pot); the index orders each pair for
// prices, so every food comes before wood
var GOODS = FOODS.concat(['wood', 'flint', 'axe', 'pick', 'clay', 'pot', 'hoe', 'sickle', 'water']);
// goods traded whole, one at a time
var WHOLE = { axe: true, pick: true, pot: true, hoe: true, sickle: true };
