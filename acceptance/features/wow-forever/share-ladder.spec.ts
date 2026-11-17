import { test, expect } from '@playwright/test';
import { ForeverCharacter } from '@/games/wow/forever/api/forever-types';
import { seedAuth } from '../../mocks/account';
import { mockLadderBackend } from '../../mocks/ladders';
import { foreverCharacter, ForeverEntity, mockWowhead } from '../../mocks/wow-forever';
import { VALID_VIEW_ID } from '../../constants';

test.describe('WoW Forever: a shared ladder', () => {
  test('someone else opening a shared link sees the ladder, without the Edit button', async ({
    page,
  }) => {
    await seedAuth(page);
    await mockWowhead(page);
    await mockLadderBackend<ForeverCharacter, ForeverEntity>(page, {
      game: 'WOW_FOREVER',
      members: [foreverCharacter('Daxan', 'Windfury', 22)],
      owner: null,
    });

    await page.goto(`/wow-forever/${VALID_VIEW_ID}`);

    await expect(page.getByText('Daxan Windfury')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  });
});
