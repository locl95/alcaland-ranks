import { test, expect } from '@playwright/test';
import { LolPlayer } from '@/games/lol/api/lol-types';
import { seedAuth } from '../../mocks/account';
import { ladder, mockLadderBackend } from '../../mocks/ladders';
import { LolEntity, lolPlayer, mockDataDragon, rankedLeague } from '../../mocks/lol';
import { VALID_VIEW_ID } from '../../constants';

test.describe('League of Legends: paging', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockDataDragon(page);
  });

  test('the ladder list pages through the ladders, ten at a time', async ({ page }) => {
    await mockLadderBackend<LolPlayer, LolEntity>(page, {
      game: 'LOL',
      ladders: Array.from({ length: 25 }, (_, i) => ladder('LOL', `l${i + 1}`, `Squad ${i + 1}`)),
    });

    await page.goto('/lol');
    const pager = page.getByRole('navigation', { name: 'Ladder list pages' });
    await expect(pager).toContainText('1–10 of 25');

    await pager.getByRole('button', { name: 'Next page' }).click();
    await expect(pager).toContainText('11–20 of 25');
    await expect(page.getByRole('heading', { name: 'Squad 11', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Squad 1', exact: true })).toHaveCount(0);

    await pager.getByRole('button', { name: 'Last page' }).click();
    await expect(pager).toContainText('21–25 of 25');
    await pager.getByRole('button', { name: 'First page' }).click();
    await expect(pager).toContainText('1–10 of 25');
  });

  test('a ladder pages through its players, ten at a time', async ({ page }) => {
    // Player1 has the most LP, so the ladder ranks them in order.
    const players = Array.from({ length: 15 }, (_, i) =>
      lolPlayer(`Player${i + 1}`, rankedLeague('DIAMOND', 'I', 2000 - i * 10), undefined),
    );
    await mockLadderBackend<LolPlayer, LolEntity>(page, { game: 'LOL', members: players });

    await page.goto(`/lol/${VALID_VIEW_ID}`);
    const pager = page.getByRole('navigation', { name: 'Ladder pages' });
    await expect(pager).toContainText('1–10 of 15');
    await expect(page.getByRole('button', { name: /^Player1 / })).toBeVisible();

    await pager.getByRole('button', { name: 'Next page' }).click();
    await expect(pager).toContainText('11–15 of 15');
    await expect(page.getByRole('button', { name: /^Player11 / })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Player1 / })).toHaveCount(0);
  });
});
