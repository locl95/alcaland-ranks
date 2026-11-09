import { describe, it, expect } from 'vitest';
import { WowTalentTree } from '@/games/wow/forever/api/forever-types.ts';
import { specIconName, spentTrees } from './talents.ts';

const tree = (name: string, points: number): WowTalentTree => ({ name, points, talents: [] });

describe('spentTrees', () => {
  it('puts the tree with most points first and leaves out empty ones', () => {
    const trees = [tree('Elemental', 5), tree('Restoration', 0), tree('Enhancement', 25)];

    expect(spentTrees(trees).map((t) => t.name)).toEqual(['Enhancement', 'Elemental']);
  });
});

describe('specIconName', () => {
  it.each([
    ['Combat', 'Outlaw'],
    ['Feral Combat', 'Feral'],
    ['Enhancement', 'Enhancement'],
  ])('%s → %s', (tree, name) => {
    expect(specIconName(tree)).toBe(name);
  });
});
