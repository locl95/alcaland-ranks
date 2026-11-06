import { test, expect } from '@playwright/test';
import { seedAuth } from '../mocks/authMocks';
import { makeSimpleView, mockOwnViews } from '../mocks/viewMocks';
import { API, VALID_VIEW_ID } from '../constants';
import { lolPlayer, rankedLeague } from './mocks';

test.describe('League of Legends ladder', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockOwnViews(
      page,
      [makeSimpleView(VALID_VIEW_ID, 'Flex Squad', 'testuser', 'LOL')],
      'lol',
    );
    await page.route('https://ddragon.leagueoflegends.com/**', (route) =>
      route.request().url().endsWith('versions.json')
        ? route.fulfill({ json: ['15.1.1'] })
        : route.request().url().endsWith('champion.json')
          ? route.fulfill({ json: { data: {} } })
          : route.abort(),
    );
    await page.route(`${API}/views/${VALID_VIEW_ID}/data`, (route) =>
      route.fulfill({
        json: {
          viewName: 'Flex Squad',
          data: [
            lolPlayer('Faker', rankedLeague('CHALLENGER', 'I', 1200), undefined),
            lolPlayer('Caps', rankedLeague('DIAMOND', 'II', 40), rankedLeague('GOLD', 'I', 10)),
          ],
        },
      }),
    );
    await page.route(`${API}/views/${VALID_VIEW_ID}/cached-data`, (route) =>
      route.fulfill({ json: { viewName: 'Flex Squad', data: [] } }),
    );
  });

  test('opens a LoL ladder from the landing, ranked by Solo/Duo', async ({ page }) => {
    await page.goto('/lol');
    await page.getByText('Flex Squad').click();

    await expect(page).toHaveURL(`/lol/${VALID_VIEW_ID}`);
    await expect(page.getByText('1200 LP', { exact: true })).toBeVisible();
    await expect(page.getByText('40 LP', { exact: true })).toBeVisible();
  });

  test('switching to Flex keeps the queue in the link', async ({ page }) => {
    await page.goto(`/lol/${VALID_VIEW_ID}`);
    await page.getByRole('button', { name: 'Flex' }).click();

    await expect(page).toHaveURL(`/lol/${VALID_VIEW_ID}?queue=flex`);
    await expect(page.getByText('10 LP', { exact: true })).toBeVisible();
    await expect(page.getByText('Unranked')).toBeVisible();
  });

  test('a shared Flex link opens on Flex', async ({ page }) => {
    await page.goto(`/lol/${VALID_VIEW_ID}?queue=flex`);

    await expect(page.getByRole('button', { name: 'Flex' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByText('10 LP', { exact: true })).toBeVisible();
  });

  test('expands a player into their recent games and opens a matchup', async ({ page }) => {
    await page.goto(`/lol/${VALID_VIEW_ID}`);
    await page.getByRole('button', { name: /Faker/ }).click();

    await expect(page.getByText('Last 1 games')).toBeVisible();
    await page.getByRole('button', { name: /9\/1\/6/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Victory')).toBeVisible();
    await expect(dialog.getByText('2 / 7 / 3')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
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

  test('someone else opening a shared link does not get the Edit button', async ({ page }) => {
    await page.route(`${API}/views/${VALID_VIEW_ID}`, (route) => route.fulfill({ status: 403 }));

    await page.goto(`/lol/${VALID_VIEW_ID}`);

    await expect(page.getByText('1200 LP', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  });
});
