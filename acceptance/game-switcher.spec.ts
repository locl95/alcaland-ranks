import { test, expect } from '@playwright/test';
import { seedAuth } from './mocks/authMocks';
import { makeSimpleView, mockOwnViews } from './mocks/viewMocks';
import { mockStaticData } from './wow/mocks';

const wowLadders = Array.from({ length: 15 }, (_, i) =>
  makeSimpleView(`w${i + 1}`, `WoW Ladder ${i + 1}`),
);
const lolLadder = makeSimpleView('l1', 'Flex Squad', 'testuser', 'LOL');
const foreverLadder = makeSimpleView('f1', 'Fresh Start', 'testuser', 'WOW_FOREVER');

test.describe('Game switcher', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);
    await mockOwnViews(page, wowLadders);
    await mockOwnViews(page, [lolLadder], 'lol');
    await mockOwnViews(page, [foreverLadder], 'wow_forever');
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

  test('the game switcher takes you to your WoW Forever ladders', async ({ page }) => {
    await page.goto('/wow');
    await page.getByRole('button', { name: 'World of Warcraft Retail' }).click();
    await page.getByRole('menuitem', { name: 'World of Warcraft Forever' }).click();

    await expect(page).toHaveURL('/wow-forever');
    await expect(page.getByRole('heading', { name: 'Forever ladder' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fresh Start' })).toBeVisible();
    await expect(page.getByText(/WoW Ladder/)).toHaveCount(0);
  });
});
