import { test, expect } from '@playwright/test';
import { seedAuth } from '../mocks/authMocks';
import { mockOwnViews } from '../mocks/viewMocks';
import { API } from '../constants';

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
    await expect(page.getByRole('heading', { name: 'Forever ladder' })).toBeVisible();
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
});
