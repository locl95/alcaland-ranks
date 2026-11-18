import { test, expect } from '@playwright/test';
import { ForeverCharacter } from '@/games/wow/forever/api/forever-types';
import { seedAuth } from '../../mocks/account';
import { mockLadderBackend } from '../../mocks/ladders';
import { ForeverEntity } from '../../mocks/wow-forever';

test.describe('WoW Forever: deleting a ladder', () => {
  test('the owner deletes a ladder from their list', async ({ page }) => {
    await seedAuth(page);
    const backend = await mockLadderBackend<ForeverCharacter, ForeverEntity>(page, {
      game: 'WOW_FOREVER',
    });

    await page.goto('/wow-forever');
    await expect(page.getByRole('heading', { name: 'My Ladder' })).toBeVisible();
    await page.getByTitle('Delete view').click();

    await expect(page.getByRole('heading', { name: 'My Ladder' })).toBeHidden();
    expect(backend.deleted()).toBe(true);
  });
});
