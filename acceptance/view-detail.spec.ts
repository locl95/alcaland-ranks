import { test, expect } from '@playwright/test';
import { seedAuth } from './mocks/authMocks';
import {
  makeSimpleView,
  mockEntitiesExist,
  mockFeaturedViews,
  mockOwnViews,
} from './mocks/viewMocks';
import { mockCharacter, mockSeason } from './mocks/raiderioMocks';

import { API, VALID_VIEW_ID } from './constants';
import { pickRealm } from './helpers';
import { ViewData } from '../src/features/views/api/raiderio';

const viewData: ViewData = { data: [mockCharacter], viewName: 'My Ladder' };
const emptyViewData: ViewData = { data: [], viewName: 'My Ladder' };

async function mockViewDetailApis(page: Parameters<typeof seedAuth>[0], data = viewData) {
  await page.route(`${API}/views/${VALID_VIEW_ID}/data`, (route) => route.fulfill({ json: data }));
  await page.route(`${API}/views/${VALID_VIEW_ID}/cached-data`, (route) =>
    route.fulfill({ json: emptyViewData }),
  );
  await page.route(`${API}/sources/wow/static`, (route) => route.fulfill({ json: mockSeason }));
}

test.describe('view detail', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockViewDetailApis(page);
    await mockEntitiesExist(page);
  });

  test('renders the character ladder and dungeon grid', async ({ page }) => {
    await page.goto(`/${VALID_VIEW_ID}`);

    await expect(page.getByText('Ladder', { exact: true })).toBeVisible();
    await expect(page.getByText('Arthas').first()).toBeVisible();
    await expect(page.getByText('Siege of Boralus')).toBeVisible();
  });

  test('edit: deleting all characters hides the ladder', async ({ page }) => {
    await mockFeaturedViews(page);
    await mockOwnViews(page, [makeSimpleView(VALID_VIEW_ID, 'My Ladder')]);

    // override the beforeEach data mock so the refetch after PUT returns empty
    let saved = false;
    await page.route(`${API}/views/${VALID_VIEW_ID}/data`, (route) =>
      route.fulfill({ json: saved ? emptyViewData : viewData }),
    );
    await page.route(`${API}/views/${VALID_VIEW_ID}`, async (route) => {
      saved = true;
      await route.fulfill({ json: { id: 'edit-op-123' } });
    });
    await page.route(`${API}/operations/edit-op-123`, (route) =>
      route.fulfill({ json: { id: 'edit-op-123', status: 'COMPLETED' } }),
    );

    // navigate from views-page so location.state carries the owner → canEdit = true
    await page.goto('/');
    await page.getByText('My Ladder').click();

    await expect(page.getByText('Arthas').first()).toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByText('Edit your ladder')).toBeVisible();

    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    await expect(page.getByText('No characters in this ladder')).toBeVisible();
  });

  test('edit: adding a character shows it as syncing in the ladder', async ({ page }) => {
    await mockFeaturedViews(page);
    await mockOwnViews(page, [makeSimpleView(VALID_VIEW_ID, 'My Ladder')]);

    await page.route(`${API}/views/${VALID_VIEW_ID}`, (route) =>
      route.fulfill({ json: { id: 'edit-op-123' } }),
    );
    // Keep the poll alive so the syncing indicator stays visible during the assertion.
    await page.route(`${API}/operations/edit-op-123`, (route) =>
      route.fulfill({ json: { id: 'edit-op-123', status: 'PENDING' } }),
    );

    await page.goto('/');
    await page.getByText('My Ladder').click();

    await expect(page.getByText('Arthas').first()).toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByText('Edit your ladder')).toBeVisible();

    await page.getByPlaceholder('Name').fill('Sylvanas');
    await pickRealm(page, 'Silvermoon');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    await expect(page.getByText('Edit your ladder')).not.toBeVisible();
    await expect(page.getByText('Arthas').first()).toBeVisible();
    await expect(page.getByText('Sylvanas').first()).toBeVisible();
    await expect(page.getByText('Syncing…')).toBeVisible();
  });

  test('edit: flags a character that does not exist and blocks saving', async ({ page }) => {
    await mockFeaturedViews(page);
    await mockOwnViews(page, [makeSimpleView(VALID_VIEW_ID, 'My Ladder')]);
    await page.route(`${API}/entities/exists`, (route) =>
      route.fulfill({
        json: {
          exist: [],
          nonExisting: [{ name: 'Fake', region: 'eu', realm: 'silvermoon' }],
          unchecked: [],
        },
      }),
    );

    await page.goto('/');
    await page.getByText('My Ladder').click();
    await page.getByRole('button', { name: 'Edit' }).click();

    await page.getByPlaceholder('Name').fill('Fake');
    await pickRealm(page, 'Silvermoon');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await expect(page.getByTitle('Character not found')).toBeVisible();
    await expect(
      page.getByText('Fake was not found. Check the name, realm and region.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Done' })).toBeDisabled();

    await page.getByRole('button', { name: 'Delete' }).last().click();
    await expect(page.getByRole('button', { name: 'Done' })).toBeEnabled();
  });

  test('edit: opening the realm list does not resize the dialog or show scrollbars', async ({
    page,
  }) => {
    await mockFeaturedViews(page);
    await mockOwnViews(page, [makeSimpleView(VALID_VIEW_ID, 'My Ladder')]);

    await page.goto('/');
    await page.getByText('My Ladder').click();
    await page.getByRole('button', { name: 'Edit' }).click();

    const dialog = page.locator('.edit-view-content');
    const before = await dialog.boundingBox();

    await page.getByLabel('Realm').click();
    await expect(page.getByRole('listbox')).toBeVisible();

    const after = await dialog.boundingBox();
    expect(after?.height).toBe(before?.height);

    const metrics = await page.getByRole('listbox').evaluate((el: HTMLElement) => {
      const style = getComputedStyle(el);
      const borders = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
      return {
        overflowsHorizontally: el.scrollWidth > el.clientWidth,
        scrollbarWidth: el.offsetWidth - el.clientWidth - borders,
        isScrollable: el.scrollHeight > el.clientHeight,
      };
    });
    expect(metrics.overflowsHorizontally).toBe(false);
    expect(metrics.scrollbarWidth).toBe(0);
    expect(metrics.isScrollable).toBe(true);
  });

  test('edit: blocks saving while a typed character has not been added', async ({ page }) => {
    await mockFeaturedViews(page);
    await mockOwnViews(page, [makeSimpleView(VALID_VIEW_ID, 'My Ladder')]);

    await page.goto('/');
    await page.getByText('My Ladder').click();
    await page.getByRole('button', { name: 'Edit' }).click();

    await expect(page.getByRole('button', { name: 'Done' })).toBeEnabled();
    await page.getByPlaceholder('Name').fill('Sylvanas');
    await expect(page.getByRole('button', { name: 'Done' })).toBeDisabled();
  });

  test('edit: shows sync error dialog when an added character is not found after poll completes', async ({
    page,
  }) => {
    await mockFeaturedViews(page);
    await mockOwnViews(page, [makeSimpleView(VALID_VIEW_ID, 'My Ladder')]);

    await page.route(`${API}/views/${VALID_VIEW_ID}`, (route) =>
      route.fulfill({ json: { id: 'edit-op-fail' } }),
    );
    // Poll returns FAILED and the data mock still returns only Arthas → Sylvanas detected as failed.
    await page.route(`${API}/operations/edit-op-fail`, (route) =>
      route.fulfill({ json: { id: 'edit-op-fail', status: 'FAILED' } }),
    );

    await page.goto('/');
    await page.getByText('My Ladder').click();

    await expect(page.getByText('Arthas').first()).toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByPlaceholder('Name').fill('Sylvanas');
    await pickRealm(page, 'Silvermoon');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    await expect(page.getByText("Some characters couldn't be synced")).toBeVisible();
    await expect(page.getByText('Sylvanas')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Sync button
  // ---------------------------------------------------------------------------

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

    await page.goto(`/${VALID_VIEW_ID}`);
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

    await page.goto(`/${VALID_VIEW_ID}`);
    await page.getByRole('button', { name: 'Sync' }).click();

    await expect(page.getByRole('button', { name: 'Syncing...' })).toBeDisabled();

    // Wait for the sync to complete so no requests are left hanging
    await expect(page.getByRole('button', { name: 'Sync' })).toBeEnabled({ timeout: 10_000 });
  });

  test('edit: added character is reconciled after refetch returns real score', async ({ page }) => {
    await mockFeaturedViews(page);
    await mockOwnViews(page, [makeSimpleView(VALID_VIEW_ID, 'My Ladder')]);

    const mockAddedCharacter = {
      ...mockCharacter,
      id: 2,
      name: 'Sylvanas',
      realm: 'Silvermoon',
      score: 2500,
    };

    let saved = false;
    await page.route(`${API}/views/${VALID_VIEW_ID}/data`, (route) =>
      route.fulfill({
        json: saved
          ? { data: [mockCharacter, mockAddedCharacter], viewName: 'My Ladder' }
          : viewData,
      }),
    );
    await page.route(`${API}/views/${VALID_VIEW_ID}`, async (route) => {
      saved = true;
      await route.fulfill({ json: { id: 'edit-op-123' } });
    });
    await page.route(`${API}/operations/edit-op-123`, (route) =>
      route.fulfill({ json: { id: 'edit-op-123', status: 'COMPLETED' } }),
    );

    await page.goto('/');
    await page.getByText('My Ladder').click();

    await expect(page.getByText('Arthas').first()).toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByText('Edit your ladder')).toBeVisible();

    await page.getByPlaceholder('Name').fill('Sylvanas');
    await pickRealm(page, 'Silvermoon');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    await expect(page.getByText('Edit your ladder')).not.toBeVisible();
    await expect(page.getByText('Arthas').first()).toBeVisible();
    await expect(page.getByText('Sylvanas').first()).toBeVisible();
    await expect(page.getByText('Syncing…')).not.toBeVisible();
  });
});
