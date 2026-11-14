import { test, expect, Page } from '@playwright/test';
import { seedAuth } from '../mocks/authMocks';
import { makeSimpleView, mockOwnViews } from '../mocks/viewMocks';
import { API, VALID_VIEW_ID } from '../constants';
import { BRAWLERS_HOOD, ENHANCEMENT, foreverCharacter } from './mocks';

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
    talents: await part('Talents'),
    equipment: await part('Equipment'),
  };
};

// Layout only: what each part shows is covered in view-detail.spec.ts.
test.describe("WoW Forever character panel's layout", () => {
  test.beforeEach(async ({ page }) => {
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
                items: [BRAWLERS_HOOD],
                talents: [ENHANCEMENT],
                pvp: { honorableKills: 68, rank: 0 },
              }),
            ],
          },
        }),
      );
    }
  });

  test('on a phone, stacks PvP, then talents, then equipment', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { pvp, talents, equipment } = await openDaxan(page);

    expect(pvp.y + pvp.height).toBeLessThanOrEqual(talents.y);
    expect(talents.y + talents.height).toBeLessThanOrEqual(equipment.y);
  });

  test('on a wide screen, puts PvP over the equipment and the talents beside them', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const { pvp, talents, equipment } = await openDaxan(page);

    expect(pvp.y + pvp.height).toBeLessThanOrEqual(equipment.y);
    expect(equipment.x + equipment.width).toBeLessThanOrEqual(talents.x);
    expect(talents.y).toBe(pvp.y);
  });
});
