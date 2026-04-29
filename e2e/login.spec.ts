import { test, expect } from '@playwright/test';
import { TEST_ACCESS_TOKEN, TEST_REFRESH_TOKEN, mockFeaturedViews, mockOwnViews } from './helpers';

const API = 'http://localhost:8080/api';

test.beforeEach(async ({ page }) => {
  await mockFeaturedViews(page);
  await mockOwnViews(page);
});

test('user can log in and is redirected to the views page', async ({ page }) => {
  await page.route(`${API}/auth`, (route) =>
    route.fulfill({
      json: { accessToken: TEST_ACCESS_TOKEN, refreshToken: TEST_REFRESH_TOKEN },
    }),
  );

  await page.goto('/login');
  await page.getByLabel('Username').fill('testuser');
  await page.getByLabel('Password').fill('secret');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByText('Mythic+ ladder tracker')).toBeVisible();
});

test('shows invalid credentials error on wrong password', async ({ page }) => {
  await page.route(`${API}/auth`, (route) =>
    route.fulfill({ status: 401, json: { message: 'Unauthorized' } }),
  );

  await page.goto('/login');
  await page.getByLabel('Username').fill('testuser');
  await page.getByLabel('Password').fill('wrongpassword');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByText('Invalid username or password.')).toBeVisible();
  await expect(page).toHaveURL('/login');
});

test('submit button is disabled when fields are empty', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeDisabled();
});
