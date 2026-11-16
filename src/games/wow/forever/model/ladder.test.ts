import { describe, it, expect } from 'vitest';
import { ForeverCharacter } from '@/games/wow/forever/api/forever-types.ts';
import { buildLadder, sortLadder } from './ladder.ts';

const character = (
  name: string,
  level: number,
  experience = 0,
  equippedItemLevel = 10,
): ForeverCharacter => ({
  type: 'wow_forever',
  id: 1,
  name,
  surname: 'Test',
  region: 'eu',
  level,
  averageItemLevel: equippedItemLevel,
  equippedItemLevel,
  characterClass: 'Warrior',
  race: 'Orc',
  gender: 'Female',
  faction: 'Horde',
  guild: null,
  experience,
  ruleset: 'PvP',
  lastLogin: '2026-11-05T20:00:00Z',
  items: [],
  talents: [],
});

const names = (characters: ForeverCharacter[]) =>
  buildLadder(characters, []).map((e) => e.character.name);

describe('buildLadder', () => {
  it('ranks by level, then experience, then equipped item level', () => {
    expect(
      names([
        character('Low', 10, 900),
        character('High', 20),
        character('MoreXp', 15, 500),
        character('LessXp', 15, 100, 30),
        character('BetterGear', 15, 100, 40),
      ]),
    ).toEqual(['High', 'MoreXp', 'BetterGear', 'LessXp', 'Low']);
  });

  it('counts places and levels gained since the last snapshot', () => {
    const ladder = buildLadder(
      [character('Riser', 20), character('Faller', 15)],
      [character('Riser', 12), character('Faller', 14)],
    );

    expect(
      ladder.map(({ character, standingChange, levelGain }) => ({
        name: character.name,
        standingChange,
        levelGain,
      })),
    ).toEqual([
      { name: 'Riser', standingChange: 1, levelGain: 8 },
      { name: 'Faller', standingChange: -1, levelGain: 1 },
    ]);
  });

  it('has no change for a character missing from the snapshot', () => {
    const [entry] = buildLadder([character('Newcomer', 20)], [character('Gone', 30)]);

    expect(entry.standingChange).toBeNull();
    expect(entry.levelGain).toBe(0);
    expect(entry.ilvlGain).toBe(0);
  });

  it('counts item levels gained since the last snapshot, a drop as none', () => {
    const ladder = buildLadder(
      [character('Geared', 20, 0, 24), character('Swapped', 18, 0, 15)],
      [character('Geared', 20, 0, 18), character('Swapped', 18, 0, 19)],
    );

    expect(ladder.map(({ ilvlGain }) => ilvlGain)).toEqual([6, 0]);
  });
});

describe('sortLadder', () => {
  // Ladder order: Top (lvl 30, ilvl 20), Mid (lvl 20, ilvl 50), Low (lvl 10, ilvl 20).
  const rows = buildLadder(
    [character('Low', 10, 0, 20), character('Top', 30, 0, 20), character('Mid', 20, 0, 50)],
    [],
  ).map((entry, index) => ({ entry, position: index + 1 }));
  const sorted = (key: 'level' | 'ilvl', direction: 'asc' | 'desc') =>
    sortLadder(rows, { key, direction }).map(({ entry, position }) => [
      entry.character.name,
      position,
    ]);

  it('keeps the ladder order by level, or reverses it', () => {
    expect(sorted('level', 'desc')).toEqual([
      ['Top', 1],
      ['Mid', 2],
      ['Low', 3],
    ]);
    expect(sorted('level', 'asc')).toEqual([
      ['Low', 3],
      ['Mid', 2],
      ['Top', 1],
    ]);
  });

  it('sorts by item level either way, the ladder breaking ties', () => {
    expect(sorted('ilvl', 'desc')).toEqual([
      ['Mid', 2],
      ['Top', 1],
      ['Low', 3],
    ]);
    expect(sorted('ilvl', 'asc')).toEqual([
      ['Top', 1],
      ['Low', 3],
      ['Mid', 2],
    ]);
  });
});
