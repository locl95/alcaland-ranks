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
import { expectListAnchoredToInput, pickRealm } from './helpers';

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

  // The realm list used to be mouse-only because Enter on it submitted the
  // whole dialog. These two pin down that it no longer leaks either key.
  test('Enter picks a realm instead of submitting the dialog', async ({ page }) => {
    let createCalled = false;
    await page.route(`${API}/views`, (route) => {
      createCalled = true;
      return route.fulfill({ json: { id: 'op-kbd' } });
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();
    await page.getByLabel('Realm').first().fill('sangu');
    await expect(page.getByRole('option', { name: 'Sanguino' })).toBeVisible();

    await page.keyboard.press('Enter');

    await expect(page.getByLabel('Realm').first()).toHaveValue('Sanguino');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(page.getByText('Create new m+ ladder')).toBeVisible();
    expect(createCalled).toBe(false);
  });

  test('Escape closes the realm list before it closes the dialog', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();
    await page.getByLabel('Realm').first().fill('sangu');
    await expect(page.getByRole('listbox')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(page.getByText('Create new m+ ladder')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByText('Create new m+ ladder')).toHaveCount(0);
  });

  test('the realm list opens anchored to its input and does not grow the dialog', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();

    const input = page.getByLabel('Realm').first();
    await input.fill('sa');
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sanguino' })).toBeVisible();

    await expectListAnchoredToInput(page, input);

    const panelScrolls = await page
      .locator('.dialog-panel')
      .evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(panelScrolls).toBe(false);
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
    await page.route(`${API}/views?game=wow&page=*`, (route) =>
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

test.describe('paging the ladder list', () => {
  const manyViews = Array.from({ length: 25 }, (_, i) =>
    makeSimpleView(`v${i + 1}`, `Ladder ${i + 1}`),
  );

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);
    await mockFeaturedViews(page);
    await mockOwnViews(page, manyViews);
  });

  test('walks through the pages the server returns', async ({ page }) => {
    const requestedPages: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      const isOwnList = !url.searchParams.has('featured');
      if (url.pathname.endsWith('/views') && url.searchParams.has('page') && isOwnList) {
        requestedPages.push(url.searchParams.get('page')!);
      }
    });

    await page.goto('/');

    await expect(page.locator('.view-row')).toHaveCount(10);
    await expect(page.getByText('1–10 of 25')).toBeVisible();

    await page.getByRole('button', { name: 'Next page' }).click();

    await expect(page.getByText('11–20 of 25')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ladder 11', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ladder 1', exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Next page' }).click();

    await expect(page.getByText('21–25 of 25')).toBeVisible();
    await expect(page.locator('.view-row')).toHaveCount(5);
    await expect(page.getByRole('button', { name: 'Next page' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    await page.getByRole('button', { name: 'Previous page' }).click();
    await expect(page.getByText('11–20 of 25')).toBeVisible();

    expect(requestedPages).toEqual(['1', '2', '3']);
  });

  test('jumps to the last page and back to the first', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('1–10 of 25')).toBeVisible();

    await page.getByRole('button', { name: 'Last page' }).click();

    await expect(page.getByText('21–25 of 25')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ladder 21', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Last page' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    await page.getByRole('button', { name: 'First page' }).click();

    await expect(page.getByText('1–10 of 25')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ladder 1', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'First page' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  test('asks the server for a page at a time, with the metadata it needs', async ({ page }) => {
    const [request] = await Promise.all([
      page.waitForRequest((req) => {
        const url = new URL(req.url());
        return (
          url.pathname.endsWith('/views') &&
          req.method() === 'GET' &&
          !url.searchParams.has('featured')
        );
      }),
      page.goto('/'),
    ]);

    const params = new URL(request.url()).searchParams;
    expect(params.get('limit')).toBe('10');
    expect(params.get('page')).toBe('1');
    expect(params.get('include')).toBe('metadata');
  });
});

test.describe('delete view', () => {
  test('removes the view from the list immediately on delete', async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);
    await mockFeaturedViews(page);

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
