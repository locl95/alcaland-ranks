import { test, expect } from '@playwright/test';
import { seedAuth } from '../../mocks/account';

import { makeLadder, mockEntitiesExist, mockViewDetailApis } from '../../mocks/wow';
import { API, VALID_VIEW_ID } from '../../constants';

test.describe('WoW ladder detail', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockViewDetailApis(page);
    await mockEntitiesExist(page);
  });

  test('a ladder row expands from the keyboard and tabs on to its menu', async ({ page }) => {
    await page.goto(`/wow/${VALID_VIEW_ID}`);
    await page.locator('.ladder-row-toggle').first().focus();

    await page.keyboard.press('Enter');
    await expect(page.locator('.ladder-row-expanded')).toBeVisible();

    // The menu button is a sibling of the expander, not nested inside it, so
    // Tab reaches it rather than it being swallowed by the row.
    await page.keyboard.press('Tab');
    await expect(page.locator('.char-menu-btn').first()).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toBeVisible();
  });

  test('renders the character ladder and dungeon grid', async ({ page }) => {
    await page.goto(`/wow/${VALID_VIEW_ID}`);

    await expect(page.getByText('Ladder', { exact: true })).toBeVisible();
    await expect(page.getByText('Arthas').first()).toBeVisible();
    await expect(page.getByText('Siege of Boralus')).toBeVisible();
  });

  test('the ladder and each dungeon card page independently', async ({ page }) => {
    await page.route(`${API}/views/${VALID_VIEW_ID}/data`, (route) =>
      route.fulfill({ json: makeLadder(15) }),
    );
    await page.goto(`/wow/${VALID_VIEW_ID}`);

    const ladder = page.locator('.ladder-card');
    const dungeon = page.locator('.dungeon-card');

    await expect(page.locator('.ladder-row')).toHaveCount(10);
    await expect(ladder.getByText('1–10 of 15')).toBeVisible();

    await expect(dungeon.locator('.character-run-name').first()).toHaveText('Char15');
    await expect(dungeon.locator('.crown-icon')).toBeVisible();

    await ladder.getByRole('button', { name: 'Next page' }).click();

    await expect(ladder.getByText('11–15 of 15')).toBeVisible();
    await expect(page.locator('.ladder-character-name')).toHaveText([
      'Char11',
      'Char12',
      'Char13',
      'Char14',
      'Char15',
    ]);
    await expect(dungeon.getByText('1–10 of 15')).toBeVisible();
    await expect(dungeon.locator('.character-run-name').first()).toHaveText('Char15');

    await dungeon.getByRole('button', { name: 'Next page' }).click();

    await expect(dungeon.getByText('11–15 of 15')).toBeVisible();
    await expect(dungeon.locator('.character-run-name')).toHaveText([
      'Char5',
      'Char4',
      'Char3',
      'Char2',
      'Char1',
    ]);
    await expect(ladder.getByText('11–15 of 15')).toBeVisible();
  });
});
