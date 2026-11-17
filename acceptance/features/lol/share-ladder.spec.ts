import { test, expect } from '@playwright/test';
import { seedAuth } from '../../mocks/account';
import { mockLolLadder } from '../../mocks/lol';
import { API, VALID_VIEW_ID } from '../../constants';

test.describe('League of Legends shared ladder', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockLolLadder(page);
  });

  test('someone else opening a shared link does not get the Edit button', async ({ page }) => {
    await page.route(`${API}/views/${VALID_VIEW_ID}`, (route) => route.fulfill({ status: 403 }));

    await page.goto(`/lol/${VALID_VIEW_ID}`);

    await expect(page.getByText('1200 LP', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  });
});
