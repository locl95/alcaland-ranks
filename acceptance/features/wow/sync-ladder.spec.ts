import { test, expect } from '@playwright/test';
import { seedAuth } from '../../mocks/account';

import { mockCharacter, mockEntitiesExist, mockViewDetailApis, viewData } from '../../mocks/wow';
import { API, VALID_VIEW_ID } from '../../constants';

test.describe('WoW ladder sync', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockViewDetailApis(page);
    await mockEntitiesExist(page);
  });

  const makeTaskResponse = (
    status: 'PENDING' | 'SUCCESSFUL' | 'ERROR',
    retryAfter: string | null = null,
  ) => ({
    id: 'sync-task-1',
    type: 'CACHE_GAME_VIEW_DATA_TASK',
    taskStatus: { status, message: '', retryAfter },
    inserted: new Date().toISOString(),
  });

  test('sync: refetches view data and enters cooldown after a successful sync', async ({
    page,
  }) => {
    const retryAfter = new Date(Date.now() + 60_000).toISOString();
    const refreshedCharacter = { ...mockCharacter, name: 'Sylvanas', score: 4000 };
    let dataRequestCount = 0;
    await page.route(`${API}/views/${VALID_VIEW_ID}/data`, (route) => {
      dataRequestCount++;
      route.fulfill({
        json:
          dataRequestCount > 1 ? { data: [refreshedCharacter], viewName: 'My Ladder' } : viewData,
      });
    });
    await page.route(`${API}/tasks`, (route) => route.fulfill({ json: { id: 'sync-task-1' } }));
    await page.route(`${API}/tasks/sync-task-1`, (route) =>
      route.fulfill({ json: makeTaskResponse('SUCCESSFUL', retryAfter) }),
    );

    await page.goto(`/wow/${VALID_VIEW_ID}`);
    await expect(page.getByText('Arthas').first()).toBeVisible();

    await page.getByRole('button', { name: 'Sync' }).click();

    await expect(page.getByText('Sylvanas').first()).toBeVisible();
    await expect(page.locator('.header-sync-button')).toBeDisabled();
    await expect(page.locator('.header-sync-button')).not.toContainText('Sync');
  });

  test('sync: disables the button and shows Syncing... while the task is in-flight', async ({
    page,
  }) => {
    await page.route(`${API}/tasks`, (route) => route.fulfill({ json: { id: 'sync-task-1' } }));
    let polled = false;
    await page.route(`${API}/tasks/sync-task-1`, (route) => {
      route.fulfill({ json: makeTaskResponse(polled ? 'SUCCESSFUL' : 'PENDING') });
      polled = true;
    });

    await page.goto(`/wow/${VALID_VIEW_ID}`);
    await page.getByRole('button', { name: 'Sync' }).click();

    await expect(page.getByRole('button', { name: 'Syncing...' })).toBeDisabled();

    // Wait for the sync to complete so no requests are left hanging
    await expect(page.getByRole('button', { name: 'Sync' })).toBeEnabled({ timeout: 10_000 });
  });
});
