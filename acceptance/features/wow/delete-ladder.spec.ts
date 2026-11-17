import { test, expect } from '@playwright/test';
import { seedAuth } from '../../mocks/account';
import { makeSimpleView } from '../../mocks/views';
import { mockStaticData } from '../../mocks/wow';
import { API, VALID_VIEW_ID } from '../../constants';

test.describe('delete view', () => {
  test('removes the view from the list immediately on delete', async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);

    let deleted = false;
    await page.route(`${API}/views?game=wow&page=*`, (route) =>
      route.fulfill({
        json: { records: deleted ? [] : [makeSimpleView(VALID_VIEW_ID, 'My Ladder')] },
      }),
    );
    await page.route(`${API}/views/${VALID_VIEW_ID}`, async (route) => {
      deleted = true;
      await route.fulfill({ json: { id: 'del-op-123' } });
    });
    await page.route(`${API}/operations/del-op-123`, (route) =>
      route.fulfill({ json: { id: 'del-op-123', status: 'COMPLETED' } }),
    );

    await page.goto('/');
    await expect(page.getByText('My Ladder')).toBeVisible();

    await page.getByTitle('Delete view').click();
    await expect(page.getByText('My Ladder')).not.toBeVisible();
  });
});
