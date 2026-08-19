import { test, expect } from '@playwright/test';
import { seedAuth } from './mocks/authMocks';
import {
  makeSimpleView,
  mockEntitiesExist,
  mockFeaturedViews,
  mockOwnViews,
  mockStaticData,
} from './mocks/viewMocks';

import { API, VALID_VIEW_ID } from './constants';
import { pickRealm } from './helpers';

test.describe('unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockStaticData(page);
    await mockFeaturedViews(page, [makeSimpleView('f1', 'Featured Ladder', 'someone')]);
    await mockOwnViews(page);
  });

  test('shows the app title and featured views', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Mythic+ ladder tracker')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Featured Ladder' })).toBeVisible();
  });

  test('shows the current season name from the API', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Midnight Season 1')).toBeVisible();
  });

  test('redirects to login when clicking own ladders tab without auth', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Own' }).click();
    await expect(page).toHaveURL('/login');
  });
});

test.describe('authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);
    await mockFeaturedViews(page);
    await mockOwnViews(page, [makeSimpleView(VALID_VIEW_ID, 'My Ladder')]);
  });

  test('shows own views', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('My Ladder')).toBeVisible();
  });

  test('navigates to view detail when clicking a view', async ({ page }) => {
    await page.route(`${API}/views/${VALID_VIEW_ID}/**`, (route) =>
      route.fulfill({ json: { data: [], viewName: 'My Ladder' } }),
    );

    await page.goto('/');
    await page.getByText('My Ladder').click();
    await expect(page).toHaveURL(`/${VALID_VIEW_ID}`);
  });
});

test.describe('create view', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);
    await mockFeaturedViews(page);
    await mockOwnViews(page, []);
    await mockEntitiesExist(page);
  });

  test('submits the form and shows the pending view in the list', async ({ page }) => {
    await page.route(`${API}/views`, (route) => route.fulfill({ json: { id: 'op-123' } }));
    // Keep the poll alive so the pending view stays visible during the assertion.
    await page.route(`${API}/operations/op-123`, (route) =>
      route.fulfill({ json: { id: 'op-123', status: 'PENDING' } }),
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();

    await page.getByPlaceholder('e.g., Main Push Team').fill('My New Ladder');
    await page.getByPlaceholder('Name').fill('Arthas');
    await pickRealm(page, 'Tarren Mill');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'My New Ladder' })).toBeVisible();
    await expect(page.getByText('Synchronizing with server...')).toBeVisible();
  });

  test('shows an error banner when the operation fails', async ({ page }) => {
    await page.route(`${API}/views`, (route) => route.fulfill({ json: { id: 'op-fail-123' } }));
    await page.route(`${API}/operations/op-fail-123`, (route) =>
      route.fulfill({ json: { id: 'op-fail-123', status: 'FAILED' } }),
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();

    await page.getByPlaceholder('e.g., Main Push Team').fill('My New Ladder');
    await page.getByPlaceholder('Name').fill('Arthas');
    await pickRealm(page, 'Tarren Mill');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('Failed to create ladder. Please try again.')).toBeVisible();
  });

  test('flags a character that does not exist and blocks submitting', async ({ page }) => {
    await page.route(`${API}/entities/exists`, (route) =>
      route.fulfill({
        json: {
          exist: [],
          nonExisting: [{ name: 'Fake', region: 'eu', realm: 'tarren-mill' }],
          unchecked: [],
        },
      }),
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();

    await page.getByPlaceholder('e.g., Main Push Team').fill('My New Ladder');
    await page.getByPlaceholder('Name').first().fill('Fake');
    await pickRealm(page, 'Tarren Mill');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await expect(page.getByTitle('Character not found')).toBeVisible();
    await expect(
      page.getByText('Fake was not found. Check the name, realm and region.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create', exact: true })).toBeDisabled();

    await page.getByTitle('Remove').click();
    await expect(
      page.getByText('Fake was not found. Check the name, realm and region.'),
    ).toHaveCount(0);
  });

  test('shows a found indicator and only submits verified characters', async ({ page }) => {
    await page.route(`${API}/views`, (route) => route.fulfill({ json: { id: 'op-123' } }));
    await page.route(`${API}/operations/op-123`, (route) =>
      route.fulfill({ json: { id: 'op-123', status: 'PENDING' } }),
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();

    await page.getByPlaceholder('e.g., Main Push Team').fill('My New Ladder');
    await page.getByPlaceholder('Name').first().fill('Arthas');
    await pickRealm(page, 'Tarren Mill');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await expect(page.getByTitle('Character found')).toBeVisible();

    await page.getByPlaceholder('Name').last().fill('Sylvanas');
    await expect(page.getByRole('button', { name: 'Create', exact: true })).toBeDisabled();

    const request = page.waitForRequest((r) => r.url().endsWith('/views') && r.method() === 'POST');
    await page.getByPlaceholder('Name').last().fill('');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    const entities = (await request).postDataJSON().entities;
    expect(entities).toHaveLength(1);
    expect(entities[0]).toMatchObject({ name: 'Arthas', realm: 'tarren-mill' });
  });

  test('replaces the pending view with the synced one after backend confirms it', async ({
    page,
  }) => {
    let created = false;

    // override the beforeEach mock — last registered route wins in Playwright
    await page.route(`${API}/views?game=wow`, (route) =>
      route.fulfill({
        json: { records: created ? [makeSimpleView(VALID_VIEW_ID, 'My New Ladder')] : [] },
      }),
    );
    await page.route(`${API}/views`, (route) => {
      created = true;
      route.fulfill({ json: { id: 'op-123' } });
    });
    await page.route(`${API}/operations/op-123`, (route) =>
      route.fulfill({ json: { id: 'op-123', status: 'COMPLETED', resourceId: VALID_VIEW_ID } }),
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();

    await page.getByPlaceholder('e.g., Main Push Team').fill('My New Ladder');
    await page.getByPlaceholder('Name').fill('Arthas');
    await pickRealm(page, 'Tarren Mill');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // refetch reconciles the pending view with the backend response —
    // syncing indicator never persists and the real view appears with delete available
    await expect(page.getByRole('heading', { name: 'My New Ladder' })).toBeVisible();
    await expect(page.getByText('Synchronizing with server...')).not.toBeVisible();
    await expect(page.getByTitle('Delete view')).toBeVisible();
  });
});

test.describe('delete view', () => {
  test('removes the view from the list immediately on delete', async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);
    await mockFeaturedViews(page);

    let deleted = false;
    await page.route(`${API}/views?game=wow`, (route) =>
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
