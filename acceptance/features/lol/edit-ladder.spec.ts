import { test, expect } from '@playwright/test';
import { seedAuth } from '../../mocks/account';
import { lolPlayer, mockLolLadder, rankedLeague } from '../../mocks/lol';
import { API, VALID_VIEW_ID } from '../../constants';

test.describe('League of Legends ladder edit', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockLolLadder(page);
  });

  test('the owner removes and adds players, who sync in place', async ({ page }) => {
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
        json: { exist: [{ name: 'Chovy', tag: 'KR2' }], nonExisting: [], unchecked: [] },
      }),
    );

    await page.goto('/lol');
    await page.getByText('Flex Squad').click();
    await page.getByRole('button', { name: 'Edit' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Faker#EUW')).toBeVisible();
    await dialog.getByRole('button', { name: 'Remove Caps#EUW' }).click();
    await dialog.getByLabel('Riot ID').fill('Chovy#KR2');
    await dialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(dialog.getByTitle('Player found')).toBeVisible();
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).toBeHidden();
    expect(editBody).toEqual({
      name: 'Flex Squad',
      entities: [
        { type: 'lol', name: 'Faker', tag: 'EUW' },
        { type: 'lol', name: 'Chovy', tag: 'KR2' },
      ],
      published: true,
      featured: false,
      game: 'LOL',
    });
    await expect(page.getByRole('row', { name: /Chovy #KR2 Syncing…/ })).toBeVisible();
    await expect(page.getByRole('row', { name: /Caps #EUW Deleting…/ })).toBeVisible();

    await page.route(`${API}/views/${VALID_VIEW_ID}/data`, (route) =>
      route.fulfill({
        json: {
          viewName: 'Flex Squad',
          data: [
            lolPlayer('Faker', rankedLeague('CHALLENGER', 'I', 1200), undefined),
            {
              ...lolPlayer('Chovy', rankedLeague('GRANDMASTER', 'I', 900), undefined),
              summonerTag: 'KR2',
            },
          ],
        },
      }),
    );
    operationDone = true;

    await expect(page.getByText('900 LP', { exact: true })).toBeVisible();
    await expect(page.getByText(/Syncing…|Deleting…/)).toHaveCount(0);
    await expect(page.getByText('Caps')).toHaveCount(0);
  });

  test('a player the backend could not sync is listed in an error dialog', async ({ page }) => {
    await page.route(`${API}/views/${VALID_VIEW_ID}`, (route) =>
      route.request().method() === 'PUT'
        ? route.fulfill({ json: { id: 'edit-op' } })
        : route.fulfill({ json: { owner: 'testuser' } }),
    );
    await page.route(`${API}/operations/edit-op`, (route) =>
      route.fulfill({ json: { id: 'edit-op', status: 'FAILED' } }),
    );
    await page.route(`${API}/entities/exists`, (route) =>
      route.fulfill({
        json: { exist: [{ name: 'Chovy', tag: 'KR2' }], nonExisting: [], unchecked: [] },
      }),
    );

    await page.goto(`/lol/${VALID_VIEW_ID}`);
    await page.getByRole('button', { name: 'Edit' }).click();
    const editDialog = page.getByRole('dialog');
    await editDialog.getByLabel('Riot ID').fill('Chovy#KR2');
    await editDialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(editDialog.getByTitle('Player found')).toBeVisible();
    await editDialog.getByRole('button', { name: 'Save' }).click();

    const errorDialog = page.getByRole('dialog', { name: "Some players couldn't be synced" });
    await expect(errorDialog.getByText('Chovy#KR2')).toBeVisible();
    await expect(page.getByText('Syncing…')).toHaveCount(0);
    await errorDialog.getByRole('button', { name: 'Got it' }).click();
    await expect(errorDialog).toBeHidden();
  });
});
