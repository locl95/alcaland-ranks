import { test, expect } from '@playwright/test';
import { seedAuth } from '../mocks/authMocks';
import { makeSimpleView, mockOwnViews } from '../mocks/viewMocks';
import { API, VALID_VIEW_ID } from '../constants';
import { foreverCharacter } from './mocks';

test.describe('WoW Forever ladder', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockOwnViews(
      page,
      [makeSimpleView(VALID_VIEW_ID, 'Fresh Start', 'testuser', 'WOW_FOREVER')],
      'wow_forever',
    );
    await page.route(`${API}/views/${VALID_VIEW_ID}/data`, (route) =>
      route.fulfill({
        json: {
          viewName: 'Fresh Start',
          data: [
            foreverCharacter('Siempre', 'Tarde', 14, { guild: null }),
            foreverCharacter('Daxan', 'Windfury', 22, { characterClass: 'Mage', ruleset: 'PvE' }),
          ],
        },
      }),
    );
    await page.route(`${API}/views/${VALID_VIEW_ID}/cached-data`, (route) =>
      route.fulfill({
        json: {
          viewName: 'Fresh Start',
          data: [
            foreverCharacter('Siempre', 'Tarde', 12),
            foreverCharacter('Daxan', 'Windfury', 10),
          ],
        },
      }),
    );
  });

  test('opens a ladder from the landing, ranked by level', async ({ page }) => {
    await page.goto('/wow-forever');
    await page.getByText('Fresh Start').click();

    await expect(page).toHaveURL(`/wow-forever/${VALID_VIEW_ID}`);
    const rows = page.getByRole('listitem');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('Daxan Windfury');
    await expect(rows.nth(0)).toContainText('<TSALAB>');
    await expect(rows.nth(0)).toContainText('PvE');
    await expect(rows.nth(0)).toContainText('↑ 1');
    await expect(rows.nth(0)).toContainText('+12');
    await expect(rows.nth(1)).toContainText('Siempre Tarde');
    await expect(rows.nth(1)).toContainText('↓ 1');
    await expect(rows.nth(1)).not.toContainText('<');
  });

  test('shows the class icon while there is no race art', async ({ page }) => {
    await page.goto(`/wow-forever/${VALID_VIEW_ID}`);

    // No race PNGs exist yet, so every portrait is the class icon.
    const rows = page.getByRole('listitem');
    await expect(rows.nth(0).getByRole('img')).toHaveAttribute('alt', 'Mage');
    await expect(rows.nth(1).getByRole('img')).toHaveAttribute('alt', 'Warrior');
  });

  test('the owner removes and adds characters, who sync in place', async ({ page }) => {
    let editBody: unknown;
    let operationDone = false;
    await page.route(`${API}/views/${VALID_VIEW_ID}`, (route) => {
      if (route.request().method() !== 'PUT') {
        return route.fulfill({ json: { owner: 'testuser' } });
      }
      editBody = route.request().postDataJSON();
      return route.fulfill({ json: { id: 'edit-op' } });
    });
    await page.route(`${API}/operations/edit-op`, (route) =>
      route.fulfill({
        json: { id: 'edit-op', status: operationDone ? 'COMPLETED' : 'PENDING' },
      }),
    );
    await page.route(`${API}/entities/exists`, (route) =>
      route.fulfill({
        json: {
          exist: [{ name: 'brakk', surname: 'ironhide', region: 'us' }],
          nonExisting: [],
          unchecked: [],
        },
      }),
    );

    await page.goto(`/wow-forever/${VALID_VIEW_ID}`);
    await page.getByRole('button', { name: 'Edit' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Daxan Windfury')).toBeVisible();
    await dialog.getByRole('button', { name: 'Remove Siempre Tarde' }).click();
    await dialog.getByLabel('Name', { exact: true }).fill('Brakk');
    await dialog.getByLabel('Surname').fill('Ironhide');
    await dialog.getByLabel('Region').selectOption('us');
    await dialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(dialog.getByTitle('Character found')).toBeVisible();
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).toBeHidden();
    expect(editBody).toEqual({
      name: 'Fresh Start',
      entities: [
        { type: 'wow_forever', name: 'Daxan', surname: 'Windfury', region: 'eu' },
        { type: 'wow_forever', name: 'Brakk', surname: 'Ironhide', region: 'us' },
      ],
      published: true,
      featured: false,
      game: 'WOW_FOREVER',
    });
    await expect(page.getByRole('listitem').filter({ hasText: 'Brakk Ironhide' })).toContainText(
      'Syncing…',
    );
    await expect(page.getByRole('listitem').filter({ hasText: 'Siempre Tarde' })).toContainText(
      'Deleting…',
    );

    await page.route(`${API}/views/${VALID_VIEW_ID}/data`, (route) =>
      route.fulfill({
        json: {
          viewName: 'Fresh Start',
          data: [
            foreverCharacter('Daxan', 'Windfury', 22),
            foreverCharacter('Brakk', 'Ironhide', 31, { region: 'us', guild: 'Horde Forever' }),
          ],
        },
      }),
    );
    operationDone = true;

    await expect(page.getByText('<Horde Forever>')).toBeVisible();
    await expect(page.getByText(/Syncing…|Deleting…/)).toHaveCount(0);
    await expect(page.getByText('Siempre Tarde')).toHaveCount(0);
  });

  test('a character the backend could not sync is listed in an error dialog', async ({ page }) => {
    await page.route(`${API}/views/${VALID_VIEW_ID}`, (route) =>
      route.request().method() === 'PUT'
        ? route.fulfill({ json: { id: 'edit-op' } })
        : route.fulfill({ json: { owner: 'testuser' } }),
    );
    await page.route(`${API}/operations/edit-op`, (route) =>
      // A character that fails to sync does not fail the operation: it is just missing.
      route.fulfill({ json: { id: 'edit-op', status: 'COMPLETED' } }),
    );
    await page.route(`${API}/entities/exists`, (route) =>
      route.fulfill({
        json: {
          exist: [{ name: 'brakk', surname: 'ironhide', region: 'eu' }],
          nonExisting: [],
          unchecked: [],
        },
      }),
    );

    await page.goto(`/wow-forever/${VALID_VIEW_ID}`);
    await page.getByRole('button', { name: 'Edit' }).click();
    const editDialog = page.getByRole('dialog');
    await editDialog.getByLabel('Name', { exact: true }).fill('Brakk');
    await editDialog.getByLabel('Surname').fill('Ironhide');
    await editDialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(editDialog.getByTitle('Character found')).toBeVisible();
    await editDialog.getByRole('button', { name: 'Save' }).click();

    const errorDialog = page.getByRole('dialog', { name: "Some characters couldn't be synced" });
    await expect(errorDialog.getByText('Brakk Ironhide')).toBeVisible();
    await expect(page.getByText('Syncing…')).toHaveCount(0);
    await errorDialog.getByRole('button', { name: 'Got it' }).click();
    await expect(errorDialog).toBeHidden();
  });

  test('someone else opening a shared link does not get the Edit button', async ({ page }) => {
    await page.route(`${API}/views/${VALID_VIEW_ID}`, (route) => route.fulfill({ status: 403 }));

    await page.goto(`/wow-forever/${VALID_VIEW_ID}`);

    await expect(page.getByText('Daxan Windfury')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  });
});
