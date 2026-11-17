import { test, expect } from '@playwright/test';
import { seedAuth } from '../../mocks/account';

import { mockEntitiesExist, mockViewDetailApis } from '../../mocks/wow';
import { VALID_VIEW_ID } from '../../constants';

test.describe('WoW shared ladder', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockViewDetailApis(page);
    await mockEntitiesExist(page);
  });

  test('a ladder link shared before game paths existed opens under /wow', async ({ page }) => {
    await page.goto(`/${VALID_VIEW_ID}`);

    await expect(page).toHaveURL(`/wow/${VALID_VIEW_ID}`);
    await expect(page.getByText('Arthas').first()).toBeVisible();
  });
});
