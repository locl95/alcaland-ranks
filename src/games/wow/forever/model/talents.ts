import { WowTalentTree } from '@/games/wow/forever/api/forever-types.ts';
import talentTrees from './talent-trees.json';

const CLASSES: Record<string, number[][]> = talentTrees.classes;

/**
 * Wowhead's talent calculator, embeddable, opened on the character's build. Null when the
 * build can't be written: a class or a talent Wowhead's trees (talent-trees.json) don't have.
 *
 * The build is a digit per talent, its rank, in Wowhead's order: the class's trees, and
 * each tree's talents by row then column. Wowhead stamps it with the trees' version.
 */
export const wowheadTalentCalc = (
  characterClass: string,
  trees: WowTalentTree[],
): string | null => {
  const classTrees = CLASSES[characterClass];
  if (!classTrees) return null;

  const ranks = new Map(trees.flatMap((tree) => tree.talents).map((t) => [t.spellId, t.rank]));
  const known = new Set(classTrees.flat());
  if ([...ranks.keys()].some((spellId) => !known.has(spellId))) return null;

  const build = classTrees
    .map((tree) =>
      tree
        .map((spellId) => ranks.get(spellId) ?? 0)
        .join('')
        .replace(/0+$/, ''),
    )
    .join('-')
    .replace(/-+$/, '');
  return `https://www.wowhead.com/forever/talent-calc/embed/${characterClass.toLowerCase()}/${talentTrees.hashVersion}${build}`;
};
