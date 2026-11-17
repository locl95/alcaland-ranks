import { test, expect } from '@playwright/test';
import { seedAuth } from '../../mocks/account';
import { makeSimpleView, mockOwnViews } from '../../mocks/views';
import {
  emptyViewData,
  mockCharacter,
  mockEntitiesExist,
  mockViewDetailApis,
  viewData,
} from '../../mocks/wow';
import { API, VALID_VIEW_ID } from '../../constants';
import { wheelBackground } from '../../helpers';
import { pickRealm } from './helpers';

test.describe('WoW ladder edit', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockViewDetailApis(page);
    await mockEntitiesExist(page);
  });

  test('edit: deleting all characters hides the ladder', async ({ page }) => {
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

    // navigate from views-page so the cached view carries the owner → canEdit = true
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

  test('edit: never adds a character that does not exist, and blocks saving', async ({ page }) => {
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

    await expect(
      page.getByText('Fake was not found. Check the name, realm and region.'),
    ).toBeVisible();

    await expect(page.locator('.character-edit-row')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Done' })).toBeDisabled();

    await page.getByPlaceholder('Name').fill('');
    await expect(page.getByRole('button', { name: 'Done' })).toBeEnabled();
  });

  test('edit: blocks saving while a typed character has not been added', async ({ page }) => {
    await mockOwnViews(page, [makeSimpleView(VALID_VIEW_ID, 'My Ladder')]);

    await page.goto('/');
    await page.getByText('My Ladder').click();
    await page.getByRole('button', { name: 'Edit' }).click();

    await expect(page.getByRole('button', { name: 'Done' })).toBeEnabled();
    await page.getByPlaceholder('Name').fill('Sylvanas');
    await expect(page.getByRole('button', { name: 'Done' })).toBeDisabled();
  });

  test('an open dialog freezes the page behind it', async ({ page }) => {
    const crowd = Array.from({ length: 25 }, (_, i) => ({
      ...mockCharacter,
      id: i + 1,
      name: `Char${i}`,
      score: 3000 - i * 30,
    }));
    await mockViewDetailApis(page, { data: crowd, viewName: 'My Ladder' });
    await mockOwnViews(page, [makeSimpleView(VALID_VIEW_ID, 'My Ladder')]);

    await page.setViewportSize({ width: 1200, height: 500 });
    await page.goto('/');
    await page.getByText('My Ladder').click();
    await expect(page.getByText('Char0').first()).toBeVisible();

    // Without this the assertion below would pass on a page that never scrolled.
    expect(await wheelBackground(page)).toBeGreaterThan(0);
    await page.evaluate(() => window.scrollTo(0, 0));

    await page.getByRole('button', { name: 'Edit' }).click();
    expect(await wheelBackground(page)).toBe(0);
  });

  test('edit: shows sync error dialog when an added character is not found after poll completes', async ({
    page,
  }) => {
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
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('edit: added character is reconciled after refetch returns real score', async ({ page }) => {
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
