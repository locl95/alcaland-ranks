import { test, expect } from '@playwright/test';
import { ForeverCharacter } from '@/games/wow/forever/api/forever-types';
import { seedAuth } from '../../mocks/account';
import { mockLadderBackend, SyncRequest } from '../../mocks/ladders';
import { foreverCharacter, ForeverEntity, mockWowhead } from '../../mocks/wow-forever';
import { VALID_VIEW_ID } from '../../constants';

test.describe('WoW Forever: syncing a ladder', () => {
  test('syncing brings the ladder up to date, then it waits before it can sync again', async ({
    page,
  }) => {
    await seedAuth(page);
    await mockWowhead(page);
    const backend = await mockLadderBackend<ForeverCharacter, ForeverEntity>(page, {
      game: 'WOW_FOREVER',
      members: [foreverCharacter('Daxan', 'Windfury', 22)],
    });
    backend.membersAfterSync = [foreverCharacter('Daxan', 'Windfury', 23)];

    await page.goto(`/wow-forever/${VALID_VIEW_ID}`);
    const daxan = page.getByRole('listitem').filter({ hasText: 'Daxan Windfury' });
    await expect(daxan).toContainText('Level 22');
    await page.getByRole('button', { name: 'Sync' }).click();

    await expect(page.getByRole('button', { name: 'Syncing...' })).toBeDisabled();
    expect(backend.syncRequested()).toEqual({
      type: 'CACHE_GAME_VIEW_DATA_TASK',
      arguments: { viewId: VALID_VIEW_ID },
    } satisfies SyncRequest);
    // The task is polled every 2s.
    await expect(daxan).toContainText('Level 23', { timeout: 10_000 });
    // The button counts down to the next sync, and waits for it.
    await expect(page.getByTitle(/^Next sync in/)).toBeDisabled();
  });
});
