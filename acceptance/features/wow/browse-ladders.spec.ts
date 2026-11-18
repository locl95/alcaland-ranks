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

  test('navigates to view detail when clicking a view', async ({ page }) => {
    await page.route(`${API}/views/${VALID_VIEW_ID}/**`, (route) =>
      route.fulfill({ json: { data: [], viewName: 'My Ladder' } }),
    );

    await page.goto('/');
    await page.getByText('My Ladder').click();
    await expect(page).toHaveURL(`/wow/${VALID_VIEW_ID}`);
  });
});
