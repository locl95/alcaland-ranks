import { ForeverCharacter } from '@/games/wow/forever/api/forever-types.ts';
import { ColumnSort } from '@/games/wow/column-sort.ts';
import { characterKey } from '@/games/wow/forever/model/character.ts';

export interface LadderEntry {
  character: ForeverCharacter;
  /** Places gained (positive) or lost since the last snapshot; null if it was not in it. */
  standingChange: number | null;
  /** Levels gained since the last snapshot. */
  levelGain: number;
}

/** A ladder entry with its real place in the ladder, kept when the rows are filtered or sorted. */
export interface PlacedEntry {
  entry: LadderEntry;
  position: number;
}

export type LadderSort = ColumnSort<'level' | 'ilvl'>;

/** The ladder's own order: level, highest first. */
export const DEFAULT_SORT: LadderSort = { key: 'level', direction: 'desc' };

/** Sorting by level is the ladder order (or its reverse); by item level, the ladder breaks ties. */
export function sortLadder(rows: PlacedEntry[], { key, direction }: LadderSort): PlacedEntry[] {
  const sign = direction === 'desc' ? 1 : -1;
  const ilvl = (row: PlacedEntry) => row.entry.character.equippedItemLevel;
  return [...rows].sort((a, b) =>
    key === 'level'
      ? sign * (a.position - b.position)
      : sign * (ilvl(b) - ilvl(a)) || a.position - b.position,
  );
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
