// Regenerates src/games/wow/forever/model/talent-trees.json from Wowhead's WoW Forever talent data.
// Run it when Wowhead updates the Forever trees: node scripts/forever-talent-trees.mjs
import { writeFileSync } from 'node:fs';

const SOURCE = 'https://nether.wowhead.com/forever/data/talents-classic';
const OUTPUT = new URL('../src/games/wow/forever/model/talent-trees.json', import.meta.url);

// Wowhead's tree ids, in the order its calculator shows each class's trees.
const CLASS_TREES = {
  Druid: [283, 281, 282],
  Hunter: [361, 363, 362],
  Mage: [81, 41, 61],
  Paladin: [382, 383, 381],
  Priest: [201, 202, 203],
  Rogue: [182, 181, 183],
  Shaman: [261, 263, 262],
  Warlock: [302, 303, 301],
  Warrior: [161, 164, 163],
};

// The file is a script: WH.setPageData("…", {…}); — take the object literal, which is plain JSON.
const firstObject = (source) => {
  const start = source.indexOf('{');
  let depth = 0;
  let inString = false;
  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (inString) {
      if (char === '\\') i++;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return JSON.parse(source.slice(start, i + 1));
  }
  throw new Error('No object found in the talent data');
};

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`${SOURCE} answered ${response.status}`);
const data = firstObject(await response.text());

// Each talent's spell is the same at every rank, and it is the spellId Blizzard sends.
const classes = Object.fromEntries(
  Object.entries(CLASS_TREES).map(([characterClass, treeIds]) => [
    characterClass,
    treeIds.map((treeId) =>
      Object.values(data.talents[treeId])
        .sort((a, b) => a.row - b.row || a.col - b.col)
        .map((talent) => talent.ranks[0]),
    ),
  ]),
);

writeFileSync(OUTPUT, `${JSON.stringify({ hashVersion: data.hashVersion, classes }, null, 2)}\n`);
console.log(`Wrote ${OUTPUT.pathname} (hash version ${data.hashVersion})`);
