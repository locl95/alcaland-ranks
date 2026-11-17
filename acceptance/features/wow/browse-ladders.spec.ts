import { test, expect } from '@playwright/test';
import { seedAuth } from '../../mocks/account';
import { makeSimpleView, mockOwnViews } from '../../mocks/views';
import { mockStaticData } from '../../mocks/wow';
import { API, VALID_VIEW_ID } from '../../constants';

test.describe('unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockStaticData(page);
    await mockOwnViews(page);
  });

  test('shows the app title and invites the visitor to sign in', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Mythic+ ladder tracker')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: "Track your group's Mythic+ climb" }),
    ).toBeVisible();
  });

  test('shows the current season name from the API', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Midnight Season 1')).toBeVisible();
  });

  test('sends the visitor to login from the empty state', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign in to get started' }).click();
    await expect(page).toHaveURL('/login');
  });
});

test.describe('authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);
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
    await expect(page).toHaveURL(`/wow/${VALID_VIEW_ID}`);
  });
});

test.describe('paging the ladder list', () => {
  const manyViews = Array.from({ length: 25 }, (_, i) =>
    makeSimpleView(`v${i + 1}`, `Ladder ${i + 1}`),
  );

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);
    await mockOwnViews(page, manyViews);
  });

  test('walks through the pages the server returns', async ({ page }) => {
    const requestedPages: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname.endsWith('/views') && url.searchParams.has('page')) {
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
        return url.pathname.endsWith('/views') && req.method() === 'GET';
      }),
      page.goto('/'),
    ]);

    const params = new URL(request.url()).searchParams;
    expect(params.get('limit')).toBe('10');
    expect(params.get('page')).toBe('1');
    expect(params.get('include')).toBe('metadata');
  });
});
