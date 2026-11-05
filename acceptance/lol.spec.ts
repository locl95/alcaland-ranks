import { test, expect } from '@playwright/test';
import { seedAuth } from './mocks/authMocks';
import { makeSimpleView, mockOwnViews, mockStaticData } from './mocks/viewMocks';
import { API } from './constants';

const wowLadders = Array.from({ length: 15 }, (_, i) =>
  makeSimpleView(`w${i + 1}`, `WoW Ladder ${i + 1}`),
);
const lolLadder = makeSimpleView('l1', 'Flex Squad', 'testuser', 'LOL');

test.describe('League of Legends', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);
    await mockOwnViews(page, wowLadders);
    await mockOwnViews(page, [lolLadder], 'lol');
  });

  test('the game switcher takes you to your LoL ladders, starting from their first page', async ({
    page,
  }) => {
    const lolPagesRequested: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname.endsWith('/views') && url.searchParams.get('game') === 'lol') {
        lolPagesRequested.push(url.searchParams.get('page')!);
      }
    });

    await page.goto('/wow');
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText('11–15 of 15')).toBeVisible();

    await page.getByRole('button', { name: 'World of Warcraft Retail' }).click();
    await page.getByRole('menuitem', { name: 'League of Legends' }).click();

    await expect(page).toHaveURL('/lol');
    await expect(page.getByText('Ranked ladder tracker')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Flex Squad' })).toBeVisible();
    await expect(page.getByText(/WoW Ladder/)).toHaveCount(0);
    expect(lolPagesRequested).toEqual(['1']);
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
