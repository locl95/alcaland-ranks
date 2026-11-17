import { test, expect, Page } from '@playwright/test';
import { LolPlayer } from '@/games/lol/api/lol-types';
import { seedAuth } from '../../mocks/account';
import { LadderRequest, mockLadderBackend } from '../../mocks/ladders';
import { LolEntity, lolPlayer, mockDataDragon, rankedLeague } from '../../mocks/lol';
import { VALID_VIEW_ID } from '../../constants';

const faker = lolPlayer('Faker', rankedLeague('CHALLENGER', 'I', 1200), undefined);
const caps = lolPlayer('Caps', rankedLeague('DIAMOND', 'II', 40), undefined);
const chovy = lolPlayer('Chovy', rankedLeague('GRANDMASTER', 'I', 900), undefined, 'KR2');

const rowOf = (page: Page, name: string) => page.getByRole('row').filter({ hasText: name });

test.describe('League of Legends: editing a ladder', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockDataDragon(page);
  });

  test('the owner removes and adds players, who sync in place', async ({ page }) => {
    const backend = await mockLadderBackend<LolPlayer, LolEntity>(page, {
      game: 'LOL',
      members: [faker, caps],
    });
    backend.operationStatus = 'PENDING';

    await page.goto(`/lol/${VALID_VIEW_ID}`);
    await page.getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Remove Caps#EUW' }).click();
    await dialog.getByLabel('Riot ID').fill('Chovy#KR2');
    await dialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(dialog.getByTitle('Player found')).toBeVisible();
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).toBeHidden();
    expect(backend.edited()).toEqual({
      name: 'My Ladder',
      entities: [
        { type: 'lol', name: 'Faker', tag: 'EUW' },
        { type: 'lol', name: 'Chovy', tag: 'KR2' },
      ],
      published: true,
      featured: false,
      game: 'LOL',
    } satisfies LadderRequest<LolEntity>);
    await expect(rowOf(page, 'Chovy')).toContainText('Syncing…');
    await expect(rowOf(page, 'Caps')).toContainText('Deleting…');

    backend.members = [faker, chovy];
    backend.operationStatus = 'COMPLETED';

    await expect(rowOf(page, 'Chovy')).toContainText('900 LP');
    await expect(page.getByText(/Syncing…|Deleting…/)).toHaveCount(0);
    await expect(rowOf(page, 'Caps')).toHaveCount(0);
  });

  // The backend tells of a player it couldn't sync in two ways: the operation fails, or it
  // completes without them.
  for (const [outcome, status] of [
    ['the operation fails', 'FAILED'],
    ['the operation completes without them', 'COMPLETED'],
  ] as const) {
    test(`a player the backend could not sync is listed in an error dialog, when ${outcome}`, async ({
      page,
    }) => {
      const backend = await mockLadderBackend<LolPlayer, LolEntity>(page, {
        game: 'LOL',
        members: [faker],
      });
      backend.operationStatus = status;

      await page.goto(`/lol/${VALID_VIEW_ID}`);
      await page.getByRole('button', { name: 'Edit' }).click();
      const editDialog = page.getByRole('dialog');
      await editDialog.getByLabel('Riot ID').fill('Chovy#KR2');
      await editDialog.getByRole('button', { name: 'Add', exact: true }).click();
      await expect(editDialog.getByTitle('Player found')).toBeVisible();
      await editDialog.getByRole('button', { name: 'Save' }).click();

      const errorDialog = page.getByRole('dialog', { name: "Some players couldn't be synced" });
      await expect(errorDialog.getByText('Chovy#KR2')).toBeVisible();
      await expect(page.getByText('Syncing…')).toHaveCount(0);
      await errorDialog.getByRole('button', { name: 'Got it' }).click();
      await expect(errorDialog).toBeHidden();
    });
  }
});
