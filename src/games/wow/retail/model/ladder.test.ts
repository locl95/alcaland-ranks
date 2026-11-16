import { describe, it, expect } from 'vitest';
import { WowProfile } from '@/games/wow/retail/api/wow-types.ts';
import { PlacedCharacter, sortLadder } from './ladder.ts';

const placed = (
  name: string,
  index: number,
  score: number | null,
  equippedItemLevel: number,
): PlacedCharacter => ({
  character: { name, score, equippedItemLevel } as WowProfile,
  index,
});

// Already in ladder order, by score; the last one is still syncing.
const rows = [
  placed('Top', 0, 3000, 640),
  placed('Mid', 1, 2500, 655),
  placed('Low', 2, 2000, 655),
  placed('Syncing', 3, null, 0),
];

const names = (sorted: PlacedCharacter[]) => sorted.map(({ character }) => character.name);

describe('sortLadder', () => {
  it('keeps the ladder order by score, highest first', () => {
    expect(names(sortLadder(rows, { key: 'score', direction: 'desc' }))).toEqual([
      'Top',
      'Mid',
      'Low',
      'Syncing',
    ]);
  });

  it('reverses it by score, lowest first, with a syncing character still last', () => {
    expect(names(sortLadder(rows, { key: 'score', direction: 'asc' }))).toEqual([
      'Low',
      'Mid',
      'Top',
      'Syncing',
    ]);
  });

  it('sorts by item level, the ladder breaking ties', () => {
    expect(names(sortLadder(rows, { key: 'ilvl', direction: 'desc' }))).toEqual([
      'Mid',
      'Low',
      'Top',
      'Syncing',
    ]);
    expect(names(sortLadder(rows, { key: 'ilvl', direction: 'asc' }))).toEqual([
      'Top',
      'Mid',
      'Low',
      'Syncing',
    ]);
  });

  it('keeps each character’s place in the ladder', () => {
    expect(sortLadder(rows, { key: 'ilvl', direction: 'desc' })[0].index).toBe(1);
  });
});
