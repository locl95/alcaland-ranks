import { WowTalentTree } from '@/games/wow/forever/api/forever-types.ts';

/** The trees with points in them, main specialization first. */
export const spentTrees = (trees: WowTalentTree[]): WowTalentTree[] =>
  trees.filter((tree) => tree.points > 0).sort((a, b) => b.points - a.points);

// Two Classic trees were renamed in Retail, whose names the spec icons go by.
const RETAIL_TREE_NAMES: Record<string, string> = {
  Combat: 'Outlaw',
  'Feral Combat': 'Feral',
};

/** The tree's name as the spec icons know it: Retail's. */
export const specIconName = (tree: string): string => RETAIL_TREE_NAMES[tree] ?? tree;
