import { test, expect } from '@playwright/test';
import { seedAuth } from '../../mocks/account';
import { mockOwnViews } from '../../mocks/views';
import { API } from '../../constants';

test.describe('WoW Forever', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('creates a ladder from name, surname and region', async ({ page }) => {
    let createBody: unknown;
    await mockOwnViews(page, [], 'wow_forever');
    await page.route(`${API}/entities/exists`, (route) =>
      route.fulfill({
        json: {
          exist: [{ name: 'daxan', surname: 'windfury', region: 'us' }],
          nonExisting: [],
          unchecked: [],
        },
      }),
    );
    await page.route(`${API}/views`, (route) => {
      createBody = route.request().postDataJSON();
      return route.fulfill({ json: { id: 'op-forever', resourceId: 'f2' } });
    });
    await page.route(`${API}/operations/op-forever`, (route) =>
      route.fulfill({ json: { id: 'op-forever', status: 'PENDING' } }),
    );

    await page.goto('/wow-forever');
    await expect(page.getByRole('heading', { name: 'Forever ladder tracker' })).toBeVisible();
    await page.getByRole('button', { name: 'Create your first ladder' }).click();
    await page.getByPlaceholder('e.g., Fresh start crew').fill('Fresh Start');
    await page.getByLabel('Name', { exact: true }).fill('Daxan');
    await page.getByLabel('Surname').fill('Windfury');
    await page.getByLabel('Region').selectOption('us');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByTitle('Character found')).toBeVisible();
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Fresh Start' })).toBeVisible();
    expect(createBody).toEqual({
      name: 'Fresh Start',
      entities: [{ type: 'wow_forever', name: 'Daxan', surname: 'Windfury', region: 'us' }],
      published: true,
      featured: false,
      game: 'WOW_FOREVER',
    });
  });

  test('creates a guild ladder from the guild name and region', async ({ page }) => {
    let guildBody: unknown;
    let createBody: unknown;
    await mockOwnViews(page, [], 'wow_forever');
    await page.route(`${API}/entities/exists/guild`, (route) => {
      guildBody = route.request().postDataJSON();
      return route.fulfill({
        json: { guild: { type: 'wow_forever', name: 'tsalab', region: 'eu', blizzardId: 104078 } },
      });
    });
    await page.route(`${API}/views`, (route) => {
      createBody = route.request().postDataJSON();
      return route.fulfill({ json: { id: 'op-guild', resourceId: 'f3' } });
    });
    await page.route(`${API}/operations/op-guild`, (route) =>
      route.fulfill({ json: { id: 'op-guild', status: 'PENDING' } }),
    );

    await page.goto('/wow-forever');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();
    await page.getByRole('button', { name: 'Guild', exact: true }).click();
    await expect(page.getByLabel('Surname')).toHaveCount(0);
    await page.getByLabel('Guild name').fill('TSALAB');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByTitle('Guild found')).toBeVisible();
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'TSALAB' })).toBeVisible();
    expect(guildBody).toEqual({ game: 'WOW_FOREVER', name: 'TSALAB', region: 'eu' });
    expect(createBody).toEqual({
      name: 'TSALAB',
      entities: [{ type: 'wow_forever', name: 'TSALAB', region: 'eu' }],
      published: true,
      featured: false,
      game: 'WOW_FOREVER',
      extraArguments: { type: 'wow', isGuild: true },
    });
  });
});
