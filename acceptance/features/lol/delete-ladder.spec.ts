import { test, expect } from '@playwright/test';
import { LolPlayer } from '@/games/lol/api/lol-types';
import { seedAuth } from '../../mocks/account';
import { mockLadderBackend } from '../../mocks/ladders';
import { LolEntity } from '../../mocks/lol';

test.describe('League of Legends: deleting a ladder', () => {
  test('the owner deletes a ladder from their list', async ({ page }) => {
    await seedAuth(page);
    const backend = await mockLadderBackend<LolPlayer, LolEntity>(page, { game: 'LOL' });

    await page.goto('/lol');
    await expect(page.getByRole('heading', { name: 'My Ladder' })).toBeVisible();
    await page.getByTitle('Delete view').click();

    await expect(page.getByRole('heading', { name: 'My Ladder' })).toBeHidden();
    expect(backend.deleted()).toBe(true);
  });
});
