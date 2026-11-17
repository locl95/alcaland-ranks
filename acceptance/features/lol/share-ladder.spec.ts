import { test, expect } from '@playwright/test';
import { LolPlayer } from '@/games/lol/api/lol-types';
import { seedAuth } from '../../mocks/account';
import { mockLadderBackend } from '../../mocks/ladders';
import { LolEntity, lolPlayer, mockDataDragon, rankedLeague } from '../../mocks/lol';
import { VALID_VIEW_ID } from '../../constants';

test.describe('League of Legends: a shared ladder', () => {
  test('someone else opening a shared link sees the ladder, without the Edit button', async ({
    page,
  }) => {
    await seedAuth(page);
    await mockDataDragon(page);
    await mockLadderBackend<LolPlayer, LolEntity>(page, {
      game: 'LOL',
      members: [lolPlayer('Faker', rankedLeague('CHALLENGER', 'I', 1200), undefined)],
      owner: null,
    });

    await page.goto(`/lol/${VALID_VIEW_ID}`);

    await expect(page.getByText('1200 LP', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  });
});
