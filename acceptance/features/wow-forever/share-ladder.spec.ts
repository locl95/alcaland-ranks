import { test, expect } from '@playwright/test';
import { seedAuth } from '../../mocks/account';
import { mockForeverLadder } from '../../mocks/wow-forever';
import { API, VALID_VIEW_ID } from '../../constants';

test.describe('WoW Forever shared ladder', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockForeverLadder(page);
  });

  test('someone else opening a shared link does not get the Edit button', async ({ page }) => {
    await page.route(`${API}/views/${VALID_VIEW_ID}`, (route) => route.fulfill({ status: 403 }));

    await page.goto(`/wow-forever/${VALID_VIEW_ID}`);

    await expect(page.getByText('Daxan Windfury')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  });

  test('the owner of a guild ladder does not get the Edit button', async ({ page }) => {
    await page.route(`${API}/views/${VALID_VIEW_ID}`, (route) =>
      route.fulfill({
        json: { owner: 'testuser', extraArguments: { type: 'wow', isGuild: true } },
      }),
    );

    await page.goto(`/wow-forever/${VALID_VIEW_ID}`);

    await expect(page.getByText('Daxan Windfury')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  });
});
