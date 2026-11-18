import { test, expect, Page } from '@playwright/test';
import { WowProfile } from '@/games/wow/retail/api/wow-types';
import { seedAuth } from '../../mocks/account';
import { ladder, mockLadderBackend } from '../../mocks/ladders';
import { mockCharacter, mockStaticData, WowEntity } from '../../mocks/wow';
import { VALID_VIEW_ID } from '../../constants';

// The dungeon grid lists the characters too: their row in the ladder is named after them,
// their guild (or "No guild") and their realm.
const ladderRow = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(` ${name} .*Tarren Mill`) });

test.describe('WoW Retail: paging', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);
  });

  test('the ladder list pages through the ladders, ten at a time', async ({ page }) => {
    await mockLadderBackend<WowProfile, WowEntity>(page, {
      game: 'WOW',
      ladders: Array.from({ length: 25 }, (_, i) => ladder('WOW', `w${i + 1}`, `Ladder ${i + 1}`)),
    });

    await page.goto('/wow');
    const pager = page.getByRole('navigation', { name: 'Ladder list pages' });
    await expect(pager).toContainText('1–10 of 25');

    await pager.getByRole('button', { name: 'Next page' }).click();
    await expect(pager).toContainText('11–20 of 25');
    await expect(page.getByRole('heading', { name: 'Ladder 11', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ladder 1', exact: true })).toHaveCount(0);

    await pager.getByRole('button', { name: 'Last page' }).click();
    await expect(pager).toContainText('21–25 of 25');
    await pager.getByRole('button', { name: 'First page' }).click();
    await expect(pager).toContainText('1–10 of 25');
  });

  test('a ladder pages through its characters, ten at a time', async ({ page }) => {
    // Char1 has the highest score, so the ladder ranks them in order.
    const characters: WowProfile[] = Array.from({ length: 15 }, (_, i) => ({
      ...mockCharacter,
      id: i + 1,
      name: `Char${i + 1}`,
      score: 3000 - i * 10,
    }));
    await mockLadderBackend<WowProfile, WowEntity>(page, { game: 'WOW', members: characters });

    await page.goto(`/wow/${VALID_VIEW_ID}`);
    const pager = page.getByRole('navigation', { name: 'Ladder pages' });
    await expect(pager).toContainText('1–10 of 15');
    await expect(ladderRow(page, 'Char1')).toBeVisible();

    await pager.getByRole('button', { name: 'Next page' }).click();
    await expect(pager).toContainText('11–15 of 15');
    await expect(ladderRow(page, 'Char11')).toBeVisible();
    await expect(ladderRow(page, 'Char1')).toHaveCount(0);
  });
});
