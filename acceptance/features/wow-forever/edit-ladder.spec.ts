import { test, expect } from '@playwright/test';
import { seedAuth } from '../../mocks/account';
import { foreverCharacter, mockForeverLadder } from '../../mocks/wow-forever';
import { API, VALID_VIEW_ID } from '../../constants';

test.describe('WoW Forever ladder edit', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockForeverLadder(page);
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
});
