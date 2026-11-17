import { test, expect, Page } from '@playwright/test';
import { seedAuth } from '../mocks/authMocks';
import { makeSimpleView, mockOwnViews } from '../mocks/viewMocks';
import { API, VALID_VIEW_ID } from '../constants';
import { ARCANE, BRAWLERS_HOOD, foreverCharacter } from './mocks';

const openDaxan = async (page: Page) => {
  // The panel slides open; measured mid-slide, its parts would be a fraction off.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/wow-forever/${VALID_VIEW_ID}`);
  await page.getByRole('button', { name: /Daxan Windfury/ }).click();

  const part = async (name: string) => {
    const region = page.getByRole('region', { name: `${name} of Daxan Windfury` });
    await expect(region).toBeVisible();
    return (await region.boundingBox())!;
  };
  return {
    pvp: await part('PvP'),
    professions: await part('Professions'),
    equipment: await part('Equipment'),
    talents: await part('Talents'),
  };
};

// Layout only: what each part shows is covered in view-detail.spec.ts.
test.describe("WoW Forever character panel's layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.route('https://www.wowhead.com/**', (route) => route.abort());
    await seedAuth(page);
    await mockOwnViews(
      page,
      [makeSimpleView(VALID_VIEW_ID, 'Fresh Start', 'testuser', 'WOW_FOREVER')],
      'wow_forever',
    );
    for (const path of ['data', 'cached-data']) {
      await page.route(`${API}/views/${VALID_VIEW_ID}/${path}`, (route) =>
        route.fulfill({
          json: {
            viewName: 'Fresh Start',
            data: [
              foreverCharacter('Daxan', 'Windfury', 43, {
                characterClass: 'Mage',
                items: [BRAWLERS_HOOD],
                talents: [ARCANE],
                pvp: { honorableKills: 68, rank: 0 },
                professions: {
                  primaries: [
                    { id: 186, name: 'Mining', skillPoints: 202, maxSkillPoints: 225, icon: null },
                  ],
                  secondaries: [
                    { id: 185, name: 'Cooking', skillPoints: 4, maxSkillPoints: 75, icon: null },
                  ],
                },
              }),
            ],
          },
        }),
      );
    }
  });

  test('on a phone, stacks PvP, professions, talents, then equipment', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { pvp, professions, equipment, talents } = await openDaxan(page);

    expect(pvp.y + pvp.height).toBeLessThanOrEqual(professions.y);
    expect(professions.y + professions.height).toBeLessThanOrEqual(talents.y);
    expect(talents.y + talents.height).toBeLessThanOrEqual(equipment.y);
  });

  test('on a wide screen, puts PvP beside the professions, over the equipment beside the talents', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const { pvp, professions, equipment, talents } = await openDaxan(page);

    expect(pvp.x + pvp.width).toBeLessThanOrEqual(professions.x);
    expect(pvp.y + pvp.height).toBeLessThanOrEqual(equipment.y);
    expect(professions.y + professions.height).toBeLessThanOrEqual(talents.y);
    expect(equipment.x + equipment.width).toBeLessThanOrEqual(talents.x);
    expect(talents.y).toBe(equipment.y);
    expect(professions.x).toBe(talents.x);
  });
});
