import { test, expect } from '@playwright/test';
import { WowProfile } from '@/games/wow/retail/api/wow-types';
import { seedAuth } from '../../mocks/account';
import { LadderRequest, mockLadderBackend } from '../../mocks/ladders';
import { mockCharacter, mockStaticData, WowEntity } from '../../mocks/wow';
import { VALID_VIEW_ID } from '../../constants';
import { pickRealm } from './helpers';

test.describe('WoW Retail: a guild ladder', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);
  });

  test('the owner creates a ladder of a whole guild from its name and realm', async ({ page }) => {
    const backend = await mockLadderBackend<WowProfile, WowEntity>(page, {
      game: 'WOW',
      ladders: [],
    });

    await page.goto('/wow');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();
    await page.getByRole('button', { name: 'Guild', exact: true }).click();
    await page.getByPlaceholder('Guild name').fill('TSALAB');
    await pickRealm(page, 'Tarren Mill');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByTitle('Guild found')).toBeVisible();
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'TSALAB' })).toBeVisible();
    expect(backend.created()).toEqual({
      name: 'TSALAB',
      entities: [{ type: 'wow', name: 'TSALAB', region: 'eu', realm: 'tarren-mill' }],
      published: true,
      featured: false,
      game: 'WOW',
      extraArguments: { type: 'wow', isGuild: true },
    } satisfies LadderRequest<WowEntity>);
  });

  // The backend keeps a guild ladder's characters in step with the roster.
  test('the owner of a guild ladder does not get the Edit button', async ({ page }) => {
    await mockLadderBackend<WowProfile, WowEntity>(page, {
      game: 'WOW',
      members: [mockCharacter],
      isGuild: true,
    });

    await page.goto(`/wow/${VALID_VIEW_ID}`);

    await expect(page.getByText('Arthas').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  });
});
