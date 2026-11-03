'use strict';
// The recipe tree as data (ODD §2 First tree v0). Stage 5a holds the stone tools; levels 2–3
// (pots, huts, farming) and metals join in 5b and 5c.
//
// A tool is a multiplier on production for its task (ODD §2 Tools). It is held as remaining
// life: a new tool is 1, and each hour of use takes 1/life off it. Starting know-how (ODD §5,
// Decided) includes the stone tools, so every agent knows these recipes.

// tasks a tool can speed, by activity
var TOOLS = {
  axe:  { act: A_WOOD,   mult: 2, life: 80 },   // cutting wood
  pick: { act: A_QUARRY, mult: 2, life: 80 },   // quarrying flint (and later ore, wells)
};
// the tool that speeds each activity, if any
var TOOL_FOR = [];
for (const t in TOOLS) TOOL_FOR[TOOLS[t].act] = t;

// recipes: inputs consumed, hours of work at home
var RECIPES = {
  axe:  { inputs: { flint: 2, wood: 1 }, hours: 3, tier: 'stone' },
  pick: { inputs: { flint: 2, wood: 1 }, hours: 3, tier: 'stone' },
};

// goods that change hands (water stays in the gourd); the index orders each pair for prices
var GOODS = ['food', 'wood', 'flint', 'axe', 'pick'];
// goods traded whole, one at a time
var WHOLE = { axe: true, pick: true };
