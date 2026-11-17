import { test, expect } from '@playwright/test';
import { WowProfile } from '@/games/wow/retail/api/wow-types';
import { seedAuth } from '../../mocks/account';
import { mockLadderBackend, SyncRequest } from '../../mocks/ladders';
import { mockCharacter, mockStaticData, WowEntity } from '../../mocks/wow';
import { VALID_VIEW_ID } from '../../constants';

test.describe('WoW Retail: syncing a ladder', () => {
  test('syncing brings the ladder up to date, then it waits before it can sync again', async ({
    page,
  }) => {
    await seedAuth(page);
    await mockStaticData(page);
    const backend = await mockLadderBackend<WowProfile, WowEntity>(page, {
      game: 'WOW',
      members: [{ ...mockCharacter, score: 3000 }],
    });
    backend.membersAfterSync = [{ ...mockCharacter, score: 3100 }];

    await page.goto(`/wow/${VALID_VIEW_ID}`);
    const arthas = page.getByRole('button').filter({ hasText: 'Arthas' });
    await expect(arthas).toContainText('3,000');
    await page.getByRole('button', { name: 'Sync' }).click();

    await expect(page.getByRole('button', { name: 'Syncing...' })).toBeDisabled();
    expect(backend.syncRequested()).toEqual({
      type: 'CACHE_GAME_VIEW_DATA_TASK',
      arguments: { viewId: VALID_VIEW_ID },
    } satisfies SyncRequest);
    // The task is polled every 2s.
    await expect(arthas).toContainText('3,100', { timeout: 10_000 });
    // The button counts down to the next sync, and waits for it.
    await expect(page.getByTitle(/^Next sync in/)).toBeDisabled();
  });
});
