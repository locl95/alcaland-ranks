import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';

// Every game's ladders do the same things, but each game wires them on its own: a journey
// that passes for one game says nothing about the others. So each game proves every journey,
// in its own folder, and this keeps a new game, or a new journey, from leaving one out.
const LADDER_JOURNEYS = [
  'create-ladder',
  'delete-ladder',
  'edit-ladder',
  'ladder-detail',
  'paging',
  'share-ladder',
  'sync-ladder',
];
const GUILD_JOURNEYS = ['guild-ladder'];

const GAMES: Record<string, string[]> = {
  wow: [...LADDER_JOURNEYS, ...GUILD_JOURNEYS],
  'wow-forever': [...LADDER_JOURNEYS, ...GUILD_JOURNEYS],
  lol: LADDER_JOURNEYS,
};

for (const [game, journeys] of Object.entries(GAMES)) {
  test(`${game} proves every ladder journey`, () => {
    const specs = readdirSync(new URL(`./${game}/`, import.meta.url))
      .filter((file) => file.endsWith('.spec.ts'))
      .map((file) => file.replace('.spec.ts', ''));

    expect(specs).toEqual(expect.arrayContaining(journeys));
  });
}
