export const AVATAR_HOST = 'https://render.worldofwarcraft.com';

export const foreverCharacter = (
  name: string,
  surname: string,
  level: number,
  overrides: object = {},
) => ({
  type: 'wow_forever',
  id: level,
  name,
  surname,
  region: 'eu',
  level,
  averageItemLevel: 20,
  equippedItemLevel: 18,
  characterClass: 'Warrior',
  race: 'Orc',
  gender: 'Female',
  faction: 'Horde',
  guild: 'TSALAB',
  experience: 1000,
  ruleset: 'PvP',
  avatar: `${AVATAR_HOST}/eu/${name.toLowerCase()}-avatar.jpg`,
  lastLogin: '2026-11-05T20:00:00Z',
  ...overrides,
});
