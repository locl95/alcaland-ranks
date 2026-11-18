import { test, expect } from '@playwright/test';
import { TEST_ACCESS_TOKEN, TEST_REFRESH_TOKEN } from '../../mocks/account';
import { makeSimpleView, mockOwnViews } from '../../mocks/views';
import { mockStaticData } from '../../mocks/wow';
import { API, VALID_VIEW_ID } from '../../constants';

test('a signed-in user signs out, and stays signed out after a reload', async ({ page }) => {
  await mockStaticData(page);
  await mockOwnViews(page, [makeSimpleView(VALID_VIEW_ID, 'My Ladder')]);
  let signedOutWith: string | null = null;
  await page.route(`${API}/auth`, (route) => {
    if (route.request().method() === 'DELETE') {
      signedOutWith = route.request().headers()['authorization'];
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({
      json: { accessToken: TEST_ACCESS_TOKEN, refreshToken: TEST_REFRESH_TOKEN },
    });
  });
  // A session left behind would be renewed on the reload, and sign the user back in.
  await page.route(`${API}/auth/refresh`, (route) =>
    route.fulfill({ json: { accessToken: TEST_ACCESS_TOKEN } }),
  );

  await page.goto('/login');
  await page.getByLabel('Username').fill('testuser');
  await page.getByLabel('Password').fill('secret');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'My Ladder' })).toBeVisible();

  await page.getByRole('button', { name: 'Account: testuser' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();

  await expect(page.getByRole('heading', { name: 'My Ladder' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Sign in to get started' })).toBeVisible();
  expect(signedOutWith).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);

  await page.reload();

  await expect(page.getByRole('button', { name: 'Sign in to get started' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Account: testuser' })).toHaveCount(0);
});
