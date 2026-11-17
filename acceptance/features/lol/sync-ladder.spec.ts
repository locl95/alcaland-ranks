import { test, expect } from '@playwright/test';
import { LolPlayer } from '@/games/lol/api/lol-types';
import { seedAuth } from '../../mocks/account';
import { mockLadderBackend, SyncRequest } from '../../mocks/ladders';
import { LolEntity, lolPlayer, mockDataDragon, rankedLeague } from '../../mocks/lol';
import { VALID_VIEW_ID } from '../../constants';

const faker = lolPlayer('Faker', rankedLeague('CHALLENGER', 'I', 1200), undefined);
const fakerClimbed = lolPlayer('Faker', rankedLeague('CHALLENGER', 'I', 1350), undefined);

test.describe('League of Legends: syncing a ladder', () => {
  test('syncing brings the ladder up to date, then it waits before it can sync again', async ({
    page,
  }) => {
    await seedAuth(page);
    await mockDataDragon(page);
    const backend = await mockLadderBackend<LolPlayer, LolEntity>(page, {
      game: 'LOL',
      members: [faker],
    });
    backend.membersAfterSync = [fakerClimbed];

    await page.goto(`/lol/${VALID_VIEW_ID}`);
    await expect(page.getByText('1200 LP', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Sync' }).click();

    await expect(page.getByRole('button', { name: 'Syncing...' })).toBeDisabled();
    expect(backend.syncRequested()).toEqual({
      type: 'CACHE_GAME_VIEW_DATA_TASK',
      arguments: { viewId: VALID_VIEW_ID },
    } satisfies SyncRequest);
    // The task is polled every 2s.
    await expect(page.getByText('1350 LP', { exact: true })).toBeVisible({ timeout: 10_000 });
    // The button counts down to the next sync, and waits for it.
    await expect(page.getByTitle(/^Next sync in/)).toBeDisabled();
  });
});
