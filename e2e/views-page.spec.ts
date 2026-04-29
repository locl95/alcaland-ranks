import { test, expect } from '@playwright/test';
import { seedAuth, mockFeaturedViews, mockOwnViews, makeSimpleView } from './helpers';

const API = 'http://localhost:8080/api';

const VALID_VIEW_ID = '12345678-1234-1234-1234-123456789012';

test.describe('unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockFeaturedViews(page, [makeSimpleView('f1', 'Featured Ladder', 'someone')]);
    await mockOwnViews(page);
  });

  test('shows the app title and featured views', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Mythic+ ladder tracker')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Featured Ladder' })).toBeVisible();
  });

  test('redirects to login when clicking own ladders tab without auth', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Own ladders' }).click();
    await expect(page).toHaveURL('/login');
  });
});

test.describe('authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
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
    await mockFeaturedViews(page);
    await mockOwnViews(page, []);
  });

  test('submits the form and shows the pending view in the list', async ({ page }) => {
    await page.route(`${API}/views`, (route) => route.fulfill({ json: {} }));

    await page.goto('/');
    await page.getByRole('button', { name: 'Create Your First View' }).click();

    await page.getByPlaceholder('e.g., Main Push Team').fill('My New Ladder');
    await page.getByPlaceholder('Name').fill('Arthas');
    await page.locator('select').nth(1).selectOption('tarren-mill');
    await page.getByTitle('Add').click();

    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'My New Ladder' })).toBeVisible();
    await expect(page.getByText('Synchronizing with server...')).toBeVisible();
  });

  test('replaces the pending view with the synced one after backend confirms it', async ({ page }) => {
    let created = false;

    // override the beforeEach mock — last registered route wins in Playwright
    await page.route(`${API}/views?game=wow`, (route) =>
      route.fulfill({
        json: { records: created ? [makeSimpleView(VALID_VIEW_ID, 'My New Ladder')] : [] },
      }),
    );
    await page.route(`${API}/views`, (route) => {
      created = true;
      route.fulfill({ json: {} });
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Create Your First View' }).click();

    await page.getByPlaceholder('e.g., Main Push Team').fill('My New Ladder');
    await page.getByPlaceholder('Name').fill('Arthas');
    await page.locator('select').nth(1).selectOption('tarren-mill');
    await page.getByTitle('Add').click();

    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // refetch reconciles the pending view with the backend response —
    // syncing indicator never persists and the real view appears with delete available
    await expect(page.getByRole('heading', { name: 'My New Ladder' })).toBeVisible();
    await expect(page.getByText('Synchronizing with server...')).not.toBeVisible();
    await expect(page.getByTitle('Delete view')).toBeVisible();
  });
});

test.describe('delete view', () => {
  test('removes the view from the list optimistically', async ({ page }) => {
    await seedAuth(page);
    await mockFeaturedViews(page);

    let deleted = false;
    await page.route(`${API}/views?game=wow`, (route) =>
      route.fulfill({ json: { records: deleted ? [] : [makeSimpleView(VALID_VIEW_ID, 'My Ladder')] } }),
    );
    await page.route(`${API}/views/${VALID_VIEW_ID}`, async (route) => {
      deleted = true;
      await route.fulfill({ status: 204 });
    });

    await page.goto('/');
    await expect(page.getByText('My Ladder')).toBeVisible();

    await page.getByTitle('Delete view').click();
    await expect(page.getByText('My Ladder')).not.toBeVisible();
  });
});
