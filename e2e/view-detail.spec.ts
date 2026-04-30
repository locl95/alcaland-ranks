import { test, expect } from '@playwright/test';
import { seedAuth } from './mocks/authMocks';
import { makeSimpleView, mockFeaturedViews, mockOwnViews } from './mocks/viewMocks';
import { mockCharacter, mockSeason } from './mocks/raiderioMocks';

import { API, VALID_VIEW_ID } from './constants';
import {ViewData} from "../src/features/views/api/raiderio";

const viewData: ViewData = { data: [mockCharacter], viewName: 'My Ladder' };
const emptyViewData: ViewData = { data: [], viewName: 'My Ladder' };

async function mockViewDetailApis(page: Parameters<typeof seedAuth>[0], data = viewData) {
  await page.route(`${API}/views/${VALID_VIEW_ID}/data`, (route) =>
    route.fulfill({ json: data }),
  );
  await page.route(`${API}/views/${VALID_VIEW_ID}/cached-data`, (route) =>
    route.fulfill({ json: emptyViewData }),
  );
  await page.route(`${API}/sources/wow/static`, (route) =>
    route.fulfill({ json: mockSeason }),
  );
}

test.describe('view detail', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockViewDetailApis(page);
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
      await route.fulfill({ status: 204 });
    });

    // navigate from views-page so location.state carries the owner → canEdit = true
    await page.goto('/');
    await page.getByText('My Ladder').click();

    await expect(page.getByText('Arthas').first()).toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByText('Edit your ladder')).toBeVisible();

    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    await expect(page.getByText('Edit your ladder')).not.toBeVisible();
    await expect(page.getByText('Arthas')).toHaveCount(0);
  });

  test('edit: adding a character shows it as syncing in the ladder', async ({ page }) => {
    await mockFeaturedViews(page);
    await mockOwnViews(page, [makeSimpleView(VALID_VIEW_ID, 'My Ladder')]);

    await page.route(`${API}/views/${VALID_VIEW_ID}`, (route) =>
      route.fulfill({ status: 204 }),
    );

    await page.goto('/');
    await page.getByText('My Ladder').click();

    await expect(page.getByText('Arthas').first()).toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByText('Edit your ladder')).toBeVisible();

    await page.getByPlaceholder('Name').fill('Sylvanas');
    await page.locator('select').nth(1).selectOption('silvermoon');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    await expect(page.getByText('Edit your ladder')).not.toBeVisible();
    await expect(page.getByText('Arthas').first()).toBeVisible();
    await expect(page.getByText('Sylvanas').first()).toBeVisible();
    await expect(page.getByText('Character is syncing')).toBeVisible();
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
      route.fulfill({ json: saved ? { data: [mockCharacter, mockAddedCharacter], viewName: 'My Ladder' } : viewData }),
    );
    await page.route(`${API}/views/${VALID_VIEW_ID}`, async (route) => {
      saved = true;
      await route.fulfill({ status: 204 });
    });

    await page.goto('/');
    await page.getByText('My Ladder').click();

    await expect(page.getByText('Arthas').first()).toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByText('Edit your ladder')).toBeVisible();

    await page.getByPlaceholder('Name').fill('Sylvanas');
    await page.locator('select').nth(1).selectOption('silvermoon');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    await expect(page.getByText('Edit your ladder')).not.toBeVisible();
    await expect(page.getByText('Arthas').first()).toBeVisible();
    await expect(page.getByText('Sylvanas').first()).toBeVisible();
    await expect(page.getByText('Character is syncing')).not.toBeVisible();
  });
});
