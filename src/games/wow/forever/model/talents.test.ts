import { describe, it, expect } from 'vitest';
import { WowTalentTree } from '@/games/wow/forever/api/forever-types.ts';
import { spentTrees } from './talents.ts';

const tree = (name: string, points: number): WowTalentTree => ({ name, points, talents: [] });

describe('spentTrees', () => {
  it('puts the tree with most points first and leaves out empty ones', () => {
    const trees = [tree('Elemental', 5), tree('Restoration', 0), tree('Enhancement', 25)];

    expect(spentTrees(trees).map((t) => t.name)).toEqual(['Enhancement', 'Elemental']);
  });
});
