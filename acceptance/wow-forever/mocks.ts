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
  lastLogin: '2026-11-05T20:00:00Z',
  items: [],
  talents: [],
  ...overrides,
});

/** An item as /views/{id}/data sends it. No icon, so the tests make no calls to Blizzard. */
export const BRAWLERS_HOOD = {
  id: 252504,
  slot: 'Head',
  quality: 'Rare',
  name: "Brawler's Leather Hood",
  level: 25,
  binding: 'Binds when picked up',
  requiredLevel: 20,
  itemSubclass: 'Leather',
  armor: '76 Armor',
  stats: ['+8 Agility', '+10 Stamina'],
  spells: [],
  sellPrice: { header: 'Sell Price:', gold: '0', silver: '12', copper: '6' },
  durability: 'Durability 48 / 50',
  weaponStats: null,
  icon: null,
  enchantments: [],
};

export const ENHANCEMENT = {
  name: 'Enhancement',
  points: 25,
  talents: [
    {
      name: 'Flurry',
      spellId: 16256,
      rank: 5,
      description:
        'Increases your attack speed by 30% for your next 3 swings after dealing a melee critical strike.',
      icon: null,
    },
  ],
};
