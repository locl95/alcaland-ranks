import { test, expect } from '@playwright/test';
import { ForeverCharacter } from '@/games/wow/forever/api/forever-types';
import { seedAuth } from '../../mocks/account';
import { ladder, mockLadderBackend } from '../../mocks/ladders';
import { foreverCharacter, ForeverEntity, mockWowhead } from '../../mocks/wow-forever';
import { VALID_VIEW_ID } from '../../constants';

test.describe('WoW Forever: paging', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockWowhead(page);
  });

  test('the ladder list pages through the ladders, ten at a time', async ({ page }) => {
    await mockLadderBackend<ForeverCharacter, ForeverEntity>(page, {
      game: 'WOW_FOREVER',
      ladders: Array.from({ length: 25 }, (_, i) =>
        ladder('WOW_FOREVER', `f${i + 1}`, `Crew ${i + 1}`),
      ),
    });

    await page.goto('/wow-forever');
    const pager = page.getByRole('navigation', { name: 'Ladder list pages' });
    await expect(pager).toContainText('1–10 of 25');

    await pager.getByRole('button', { name: 'Next page' }).click();
    await expect(pager).toContainText('11–20 of 25');
    await expect(page.getByRole('heading', { name: 'Crew 11', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Crew 1', exact: true })).toHaveCount(0);

    await pager.getByRole('button', { name: 'Last page' }).click();
    await expect(pager).toContainText('21–25 of 25');
    await pager.getByRole('button', { name: 'First page' }).click();
    await expect(pager).toContainText('1–10 of 25');
  });

  test('a ladder pages through its characters, ten at a time', async ({ page }) => {
    // Hero1 has the highest level, so the ladder ranks them in order.
    const characters = Array.from({ length: 15 }, (_, i) =>
      foreverCharacter(`Hero${i + 1}`, 'Windfury', 60 - i, { id: i + 1 }),
    );
    await mockLadderBackend<ForeverCharacter, ForeverEntity>(page, {
      game: 'WOW_FOREVER',
      members: characters,
    });

    await page.goto(`/wow-forever/${VALID_VIEW_ID}`);
    const pager = page.getByRole('navigation', { name: 'Ladder pages' });
    await expect(pager).toContainText('1–10 of 15');
    await expect(page.getByText('Hero1 Windfury')).toBeVisible();

    await pager.getByRole('button', { name: 'Next page' }).click();
    await expect(pager).toContainText('11–15 of 15');
    await expect(page.getByText('Hero11 Windfury')).toBeVisible();
    await expect(page.getByText('Hero1 Windfury')).toHaveCount(0);
  });
});
