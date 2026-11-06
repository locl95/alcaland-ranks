import { test, expect } from '@playwright/test';
import { seedAuth } from '../mocks/authMocks';
import { mockOwnViews } from '../mocks/viewMocks';
import { API } from '../constants';

test.describe('League of Legends', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('creates a ladder from Riot IDs', async ({ page }) => {
    let createBody: unknown;
    await mockOwnViews(page, [], 'lol');
    await page.route(`${API}/entities/exists`, (route) =>
      route.fulfill({
        json: { exist: [{ name: 'Faker', tag: 'KR1' }], nonExisting: [], unchecked: [] },
      }),
    );
    await page.route(`${API}/views`, (route) => {
      createBody = route.request().postDataJSON();
      return route.fulfill({ json: { id: 'op-lol', resourceId: 'l2' } });
    });
    await page.route(`${API}/operations/op-lol`, (route) =>
      route.fulfill({ json: { id: 'op-lol', status: 'PENDING' } }),
    );

    await page.goto('/lol');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();
    await page.getByPlaceholder('e.g., Friday Flex Squad').fill('Solo Grinders');
    await page.getByLabel('Riot ID').fill('Faker#KR1');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByTitle('Player found')).toBeVisible();
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Solo Grinders' })).toBeVisible();
    expect(createBody).toEqual({
      name: 'Solo Grinders',
      entities: [{ type: 'lol', name: 'Faker', tag: 'KR1' }],
      published: true,
      featured: false,
      game: 'LOL',
    });
  });
});
