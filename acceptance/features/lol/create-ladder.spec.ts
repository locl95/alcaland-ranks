import { test, expect } from '@playwright/test';
import { LolPlayer } from '@/games/lol/api/lol-types';
import { seedAuth } from '../../mocks/account';
import { LadderRequest, mockLadderBackend } from '../../mocks/ladders';
import { LolEntity, mockDataDragon } from '../../mocks/lol';

test.describe('League of Legends: creating a ladder', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockDataDragon(page);
  });

  test('the owner creates a ladder from Riot IDs, and it syncs into their list', async ({
    page,
  }) => {
    const backend = await mockLadderBackend<LolPlayer, LolEntity>(page, {
      game: 'LOL',
      ladders: [],
    });
    backend.operationStatus = 'PENDING';

    await page.goto('/lol');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();
    await page.getByPlaceholder('e.g., Friday Flex Squad').fill('Solo Grinders');
    await page.getByLabel('Riot ID').fill('Faker#KR1');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByTitle('Player found')).toBeVisible();
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Solo Grinders' })).toBeVisible();
    await expect(page.getByText('Synchronizing with server...')).toBeVisible();
    expect(backend.created()).toEqual({
      name: 'Solo Grinders',
      entities: [{ type: 'lol', name: 'Faker', tag: 'KR1' }],
      published: true,
      featured: false,
      game: 'LOL',
    } satisfies LadderRequest<LolEntity>);

    backend.operationStatus = 'COMPLETED';

    await expect(page.getByText('Synchronizing with server...')).toBeHidden();
    await expect(page.getByTitle('Delete view')).toBeVisible();
  });
});
