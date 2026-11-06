import { ForeverCharacter } from '@/games/wow-forever/api/forever-types.ts';
import { characterKey } from '@/games/wow-forever/model/character.ts';

export interface LadderEntry {
  character: ForeverCharacter;
  /** Places gained (positive) or lost since the last snapshot; null if it was not in it. */
  standingChange: number | null;
  /** Levels gained since the last snapshot. */
  levelGain: number;
}

/** Highest level first; experience, then equipped item level, break ties. */
const byProgress = (a: ForeverCharacter, b: ForeverCharacter) =>
  b.level - a.level || b.experience - a.experience || b.equippedItemLevel - a.equippedItemLevel;

export function buildLadder(
  characters: ForeverCharacter[],
  cachedCharacters: ForeverCharacter[],
): LadderEntry[] {
  const cached = [...cachedCharacters].sort(byProgress);
  const cachedIndex = new Map(cached.map((c, i) => [characterKey(c), i]));

  return [...characters].sort(byProgress).map((character, index) => {
    const before = cachedIndex.get(characterKey(character));
    return before === undefined
      ? { character, standingChange: null, levelGain: 0 }
      : {
          character,
          standingChange: before - index,
          levelGain: character.level - cached[before].level,
        };
  });
}
