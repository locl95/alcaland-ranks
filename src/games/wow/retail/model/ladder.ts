import { WowProfile } from '@/games/wow/retail/api/wow-types.ts';
import { ColumnSort } from '@/games/wow/column-sort.ts';

/** A character with its real place in the ladder (0-based), kept when the rows are filtered or sorted. */
export interface PlacedCharacter {
  character: WowProfile;
  index: number;
}

export type LadderSort = ColumnSort<'score' | 'ilvl'>;

/** The ladder's own order: M+ score, highest first. */
export const DEFAULT_SORT: LadderSort = { key: 'score', direction: 'desc' };

const isSyncing = ({ character }: PlacedCharacter) => character.score === null;

/**
 * Sorting by score is the ladder order (or its reverse); by item level, the ladder breaks ties.
 * A character still syncing has neither number yet, so it stays at the bottom either way.
 */
export function sortLadder(rows: PlacedCharacter[], { key, direction }: LadderSort) {
  const sign = direction === 'desc' ? 1 : -1;
  const ilvl = (row: PlacedCharacter) => row.character.equippedItemLevel;
  return [...rows].sort(
    (a, b) =>
      Number(isSyncing(a)) - Number(isSyncing(b)) ||
      (key === 'score'
        ? sign * (a.index - b.index)
        : sign * (ilvl(b) - ilvl(a)) || a.index - b.index),
  );
}
