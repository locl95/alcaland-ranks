import { describe, it, expect } from 'vitest';
import { WowTalentTree } from '@/games/wow/forever/api/forever-types.ts';
import talentTrees from './talent-trees.json';
import { wowheadTalentCalc } from './talents.ts';

const tree = (name: string, talents: [spellId: number, rank: number][]): WowTalentTree => ({
  name,
  points: talents.reduce((sum, [, rank]) => sum + rank, 0),
  talents: talents.map(([spellId, rank]) => ({
    name: String(spellId),
    spellId,
    rank,
    description: '',
    icon: null,
  })),
});

const calc = (wowheadClass: string, build: string) =>
  `https://www.wowhead.com/forever/talent-calc/embed/${wowheadClass}/${talentTrees.hashVersion}${build}`;

// A real character's Fury build, as Blizzard sent it and as Wowhead shows it.
const FURY = tree('Fury', [
  [12320, 5], // Cruelty
  [12322, 5], // Unbridled Wrath
  [1323963, 3], // Furious Precision
  [12317, 4], // Enrage
  [23584, 5], // Dual Wield Specialization
  [1329555, 1], // Reckless Swings
  [20502, 2], // Improved Execute
  [20500, 2], // Improved Berserker Rage
  [12328, 1], // Death Wish
  [1310315, 2], // Improved Whirlwind
  [12319, 3], // Flurry
  [23881, 1], // Bloodthirst
]);

describe('wowheadTalentCalc', () => {
  it('writes each tree in the class order, an empty tree before it as a bare dash', () => {
    expect(wowheadTalentCalc('Warrior', [FURY])).toBe(calc('warrior', '-050530045122100231'));
  });

  it('drops the trees after the last one with points', () => {
    const arms = tree('Arms', [[12282, 3]]); // Improved Heroic Strike, the first talent

    expect(wowheadTalentCalc('Warrior', [arms])).toBe(calc('warrior', '3'));
  });

  it('keeps an empty tree between two with points', () => {
    const arms = tree('Arms', [[12282, 3]]); // Improved Heroic Strike, Arms' first talent
    const protection = tree('Protection', [[12298, 2]]); // Shield Specialization, its second

    expect(wowheadTalentCalc('Warrior', [arms, protection])).toBe(calc('warrior', '3--02'));
  });

  it("writes each tree's talents where they sit, whatever order Blizzard sends the trees in", () => {
    const fury = tree('Fury', [[12320, 5]]); // Cruelty, Fury's second talent
    const arms = tree('Arms', [[12282, 3]]);

    expect(wowheadTalentCalc('Warrior', [fury, arms])).toBe(calc('warrior', '3-05'));
  });

  it('opens an empty calculator when no points are spent', () => {
    expect(wowheadTalentCalc('Warrior', [])).toBe(calc('warrior', ''));
  });

  it("is null for a talent Wowhead's trees don't have, rather than a wrong build", () => {
    expect(wowheadTalentCalc('Warrior', [tree('Fury', [[999999, 1]])])).toBeNull();
  });

  it("is null for a class Wowhead's trees don't have", () => {
    expect(wowheadTalentCalc('Death Knight', [])).toBeNull();
  });
});
