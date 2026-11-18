import { test, expect } from '@playwright/test';
import { ForeverCharacter } from '@/games/wow/forever/api/forever-types';
import { seedAuth } from '../../mocks/account';
import { LadderRequest, mockLadderBackend } from '../../mocks/ladders';
import { ForeverEntity } from '../../mocks/wow-forever';

test.describe('WoW Forever: creating a ladder', () => {
  test('the owner creates a ladder from name, surname and region, and it syncs into their list', async ({
    page,
  }) => {
    await seedAuth(page);
    const backend = await mockLadderBackend<ForeverCharacter, ForeverEntity>(page, {
      game: 'WOW_FOREVER',
      ladders: [],
    });
    backend.operationStatus = 'PENDING';

    await page.goto('/wow-forever');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();
    await page.getByPlaceholder('e.g., Fresh start crew').fill('Fresh Start');
    await page.getByLabel('Name', { exact: true }).fill('Daxan');
    await page.getByLabel('Surname').fill('Windfury');
    await page.getByLabel('Region').selectOption('us');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByTitle('Character found')).toBeVisible();
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Fresh Start' })).toBeVisible();
    await expect(page.getByText('Synchronizing with server...')).toBeVisible();
    expect(backend.created()).toEqual({
      name: 'Fresh Start',
      entities: [{ type: 'wow_forever', name: 'Daxan', surname: 'Windfury', region: 'us' }],
      published: true,
      featured: false,
      game: 'WOW_FOREVER',
    } satisfies LadderRequest<ForeverEntity>);

    backend.operationStatus = 'COMPLETED';

    await expect(page.getByText('Synchronizing with server...')).toBeHidden();
    await expect(page.getByTitle('Delete view')).toBeVisible();
  });
});
