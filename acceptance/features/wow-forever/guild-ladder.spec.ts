import { test, expect } from '@playwright/test';
import { ForeverCharacter } from '@/games/wow/forever/api/forever-types';
import { seedAuth } from '../../mocks/account';
import { LadderRequest, mockLadderBackend } from '../../mocks/ladders';
import { foreverCharacter, ForeverGuildEntity, mockWowhead } from '../../mocks/wow-forever';
import { VALID_VIEW_ID } from '../../constants';

test.describe('WoW Forever: a guild ladder', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockWowhead(page);
  });

  test('the owner creates a ladder of a whole guild from its name and region', async ({ page }) => {
    const backend = await mockLadderBackend<ForeverCharacter, ForeverGuildEntity>(page, {
      game: 'WOW_FOREVER',
      ladders: [],
    });

    await page.goto('/wow-forever');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();
    await page.getByRole('button', { name: 'Guild', exact: true }).click();
    await expect(page.getByLabel('Surname')).toHaveCount(0);
    await page.getByLabel('Guild name').fill('TSALAB');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByTitle('Guild found')).toBeVisible();
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'TSALAB' })).toBeVisible();
    expect(backend.created()).toEqual({
      name: 'TSALAB',
      entities: [{ type: 'wow_forever', name: 'TSALAB', region: 'eu' }],
      published: true,
      featured: false,
      game: 'WOW_FOREVER',
      extraArguments: { type: 'wow', isGuild: true },
    } satisfies LadderRequest<ForeverGuildEntity>);
  });

  // The backend keeps a guild ladder's characters in step with the roster.
  test('the owner of a guild ladder does not get the Edit button', async ({ page }) => {
    await mockLadderBackend<ForeverCharacter, ForeverGuildEntity>(page, {
      game: 'WOW_FOREVER',
      members: [foreverCharacter('Daxan', 'Windfury', 22)],
      isGuild: true,
    });

    await page.goto(`/wow-forever/${VALID_VIEW_ID}`);

    await expect(page.getByText('Daxan Windfury')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  });
});
