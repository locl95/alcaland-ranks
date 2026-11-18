import { test, expect, Page } from '@playwright/test';
import { ForeverCharacter } from '@/games/wow/forever/api/forever-types';
import { seedAuth } from '../../mocks/account';
import { LadderRequest, mockLadderBackend } from '../../mocks/ladders';
import { foreverCharacter, ForeverEntity, mockWowhead } from '../../mocks/wow-forever';
import { VALID_VIEW_ID } from '../../constants';

const daxan = foreverCharacter('Daxan', 'Windfury', 22);
const siempre = foreverCharacter('Siempre', 'Tarde', 14);
const brakk = foreverCharacter('Brakk', 'Ironhide', 31, { region: 'us', guild: 'Horde Forever' });

const rowOf = (page: Page, name: string) => page.getByRole('listitem').filter({ hasText: name });

test.describe('WoW Forever: editing a ladder', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockWowhead(page);
  });

  test('the owner removes and adds characters, who sync in place', async ({ page }) => {
    const backend = await mockLadderBackend<ForeverCharacter, ForeverEntity>(page, {
      game: 'WOW_FOREVER',
      members: [daxan, siempre],
    });
    backend.operationStatus = 'PENDING';

    await page.goto(`/wow-forever/${VALID_VIEW_ID}`);
    await page.getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Remove Siempre Tarde' }).click();
    await dialog.getByLabel('Name', { exact: true }).fill('Brakk');
    await dialog.getByLabel('Surname').fill('Ironhide');
    await dialog.getByLabel('Region').selectOption('us');
    await dialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(dialog.getByTitle('Character found')).toBeVisible();
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).toBeHidden();
    expect(backend.edited()).toEqual({
      name: 'My Ladder',
      entities: [
        { type: 'wow_forever', name: 'Daxan', surname: 'Windfury', region: 'eu' },
        { type: 'wow_forever', name: 'Brakk', surname: 'Ironhide', region: 'us' },
      ],
      published: true,
      featured: false,
      game: 'WOW_FOREVER',
    } satisfies LadderRequest<ForeverEntity>);
    await expect(rowOf(page, 'Brakk Ironhide')).toContainText('Syncing…');
    await expect(rowOf(page, 'Siempre Tarde')).toContainText('Deleting…');

    backend.members = [daxan, brakk];
    backend.operationStatus = 'COMPLETED';

    await expect(rowOf(page, 'Brakk Ironhide')).toContainText('<Horde Forever>');
    await expect(page.getByText(/Syncing…|Deleting…/)).toHaveCount(0);
    await expect(rowOf(page, 'Siempre Tarde')).toHaveCount(0);
  });

  // The backend tells of a character it couldn't sync in two ways: the operation fails, or it
  // completes without them.
  for (const [outcome, status] of [
    ['the operation fails', 'FAILED'],
    ['the operation completes without them', 'COMPLETED'],
  ] as const) {
    test(`a character the backend could not sync is listed in an error dialog, when ${outcome}`, async ({
      page,
    }) => {
      const backend = await mockLadderBackend<ForeverCharacter, ForeverEntity>(page, {
        game: 'WOW_FOREVER',
        members: [daxan],
      });
      backend.operationStatus = status;

      await page.goto(`/wow-forever/${VALID_VIEW_ID}`);
      await page.getByRole('button', { name: 'Edit' }).click();
      const editDialog = page.getByRole('dialog');
      await editDialog.getByLabel('Name', { exact: true }).fill('Brakk');
      await editDialog.getByLabel('Surname').fill('Ironhide');
      await editDialog.getByRole('button', { name: 'Add', exact: true }).click();
      await expect(editDialog.getByTitle('Character found')).toBeVisible();
      await editDialog.getByRole('button', { name: 'Save' }).click();

      const errorDialog = page.getByRole('dialog', { name: "Some characters couldn't be synced" });
      await expect(errorDialog.getByText('Brakk Ironhide')).toBeVisible();
      await expect(page.getByText('Syncing…')).toHaveCount(0);
      await errorDialog.getByRole('button', { name: 'Got it' }).click();
      await expect(errorDialog).toBeHidden();
    });
  }
});
