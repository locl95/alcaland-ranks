import { Page } from '@playwright/test';
import { makeSimpleView, mockOwnViews } from './views';
import { API, VALID_VIEW_ID } from '../constants';

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

// A Mage's: a talent of a tree the character's class doesn't have can't go to Wowhead.
export const ARCANE = {
  name: 'Arcane',
  points: 5,
  talents: [
    {
      name: 'Improved Channeling',
      spellId: 11237,
      rank: 5,
      description:
        'Gives your Arcane Missiles spell a 100% chance and your Arcane Blast and Arcane Wrath spells a 70% chance to not lose casting time when you take damage.',
      icon: null,
    },
  ],
};

/** A two-character ladder, its data and its last snapshot, and Wowhead kept offline. */
export async function mockForeverLadder(page: Page) {
    // The talents' calculator is Wowhead's own page: what matters is the build it's opened on.
    await page.route('https://www.wowhead.com/**', (route) => route.abort());
    await mockOwnViews(
      page,
      [makeSimpleView(VALID_VIEW_ID, 'Fresh Start', 'testuser', 'WOW_FOREVER')],
      'wow_forever',
    );
    await page.route(`${API}/views/${VALID_VIEW_ID}/data`, (route) =>
      route.fulfill({
        json: {
          viewName: 'Fresh Start',
          data: [
            foreverCharacter('Siempre', 'Tarde', 14, { guild: null }),
            foreverCharacter('Daxan', 'Windfury', 22, {
              characterClass: 'Mage',
              ruleset: 'PvE',
              items: [BRAWLERS_HOOD],
              talents: [ARCANE],
            }),
          ],
        },
      }),
    );
    await page.route(`${API}/views/${VALID_VIEW_ID}/cached-data`, (route) =>
      route.fulfill({
        json: {
          viewName: 'Fresh Start',
          data: [
            foreverCharacter('Siempre', 'Tarde', 12),
            foreverCharacter('Daxan', 'Windfury', 10),
          ],
        },
      }),
    );
}
