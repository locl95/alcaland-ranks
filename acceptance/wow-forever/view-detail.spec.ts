import { test, expect } from '@playwright/test';
import { seedAuth } from '../mocks/authMocks';
import { makeSimpleView, mockOwnViews } from '../mocks/viewMocks';
import { API, VALID_VIEW_ID } from '../constants';
import { AVATAR_HOST, foreverCharacter } from './mocks';

test.describe('WoW Forever ladder', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockOwnViews(
      page,
      [makeSimpleView(VALID_VIEW_ID, 'Fresh Start', 'testuser', 'WOW_FOREVER')],
      'wow_forever',
    );
    await page.route(`${AVATAR_HOST}/**`, (route) => route.abort());
    await page.route(`${API}/views/${VALID_VIEW_ID}/data`, (route) =>
      route.fulfill({
        json: {
          viewName: 'Fresh Start',
          data: [
            foreverCharacter('Siempre', 'Tarde', 14, { guild: null, avatar: null }),
            foreverCharacter('Daxan', 'Windfury', 22, { characterClass: 'Mage', ruleset: 'PvE' }),
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
  });

  test('opens a ladder from the landing, ranked by level', async ({ page }) => {
    await page.goto('/wow-forever');
    await page.getByText('Fresh Start').click();

    await expect(page).toHaveURL(`/wow-forever/${VALID_VIEW_ID}`);
    const rows = page.getByRole('listitem');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('Daxan Windfury');
    await expect(rows.nth(0)).toContainText('<TSALAB>');
    await expect(rows.nth(0)).toContainText('PvE');
    await expect(rows.nth(0)).toContainText('↑ 1');
    await expect(rows.nth(0)).toContainText('+12');
    await expect(rows.nth(1)).toContainText('Siempre Tarde');
    await expect(rows.nth(1)).toContainText('↓ 1');
    await expect(rows.nth(1)).not.toContainText('<');
  });

  test('shows the class icon when the avatar is missing or fails to load', async ({ page }) => {
    await page.goto(`/wow-forever/${VALID_VIEW_ID}`);

    const rows = page.getByRole('listitem');
    await expect(rows.nth(0).locator('img')).toHaveCount(1);
    await expect(rows.nth(1).locator('img')).toHaveCount(1);
  });
});
