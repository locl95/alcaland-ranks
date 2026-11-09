import { WowTalentTree } from '@/games/wow/forever/api/forever-types.ts';

/** The trees with points in them, main specialization first. */
export const spentTrees = (trees: WowTalentTree[]): WowTalentTree[] =>
  trees.filter((tree) => tree.points > 0).sort((a, b) => b.points - a.points);
