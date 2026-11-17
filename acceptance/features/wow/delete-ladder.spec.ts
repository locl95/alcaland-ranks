import { test, expect } from '@playwright/test';
import { WowProfile } from '@/games/wow/retail/api/wow-types';
import { seedAuth } from '../../mocks/account';
import { mockLadderBackend } from '../../mocks/ladders';
import { mockStaticData, WowEntity } from '../../mocks/wow';

test.describe('WoW Retail: deleting a ladder', () => {
  test('the owner deletes a ladder from their list', async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);
    const backend = await mockLadderBackend<WowProfile, WowEntity>(page, { game: 'WOW' });

    await page.goto('/wow');
    await expect(page.getByRole('heading', { name: 'My Ladder' })).toBeVisible();
    await page.getByTitle('Delete view').click();

    await expect(page.getByRole('heading', { name: 'My Ladder' })).toBeHidden();
    expect(backend.deleted()).toBe(true);
  });
});
