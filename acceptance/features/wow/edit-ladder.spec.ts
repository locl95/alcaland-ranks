import { test, expect } from '@playwright/test';
import { seedAuth } from '../../mocks/account';
import { makeSimpleView, mockOwnViews } from '../../mocks/views';
import {
  emptyViewData,
  mockCharacter,
  mockEntitiesExist,
  mockViewDetailApis,
  viewData,
} from '../../mocks/wow';
import { API, VALID_VIEW_ID } from '../../constants';
import { pickRealm } from './helpers';
import { Page } from '@playwright/test';
import { WowProfile } from '@/games/wow/retail/api/wow-types';
import { LadderRequest, mockLadderBackend } from '../../mocks/ladders';
import { mockStaticData, WowEntity } from '../../mocks/wow';

test.describe('WoW ladder edit', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockViewDetailApis(page);
    await mockEntitiesExist(page);
  });

  test('edit: deleting all characters hides the ladder', async ({ page }) => {
    await mockOwnViews(page, [makeSimpleView(VALID_VIEW_ID, 'My Ladder')]);

    // override the beforeEach data mock so the refetch after PUT returns empty
    let saved = false;
    await page.route(`${API}/views/${VALID_VIEW_ID}/data`, (route) =>
      route.fulfill({ json: saved ? emptyViewData : viewData }),
    );
    await page.route(`${API}/views/${VALID_VIEW_ID}`, async (route) => {
      saved = true;
      await route.fulfill({ json: { id: 'edit-op-123' } });
    });
    await page.route(`${API}/operations/edit-op-123`, (route) =>
      route.fulfill({ json: { id: 'edit-op-123', status: 'COMPLETED' } }),
    );

    // navigate from views-page so the cached view carries the owner → canEdit = true
    await page.goto('/');
    await page.getByText('My Ladder').click();

    await expect(page.getByText('Arthas').first()).toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByText('Edit your ladder')).toBeVisible();

    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    await expect(page.getByText('No characters in this ladder')).toBeVisible();
  });

  test('edit: never adds a character that does not exist, and blocks saving', async ({ page }) => {
    await mockOwnViews(page, [makeSimpleView(VALID_VIEW_ID, 'My Ladder')]);
    await page.route(`${API}/entities/exists`, (route) =>
      route.fulfill({
        json: {
          exist: [],
          nonExisting: [{ name: 'Fake', region: 'eu', realm: 'silvermoon' }],
          unchecked: [],
        },
      }),
    );

    await page.goto('/');
    await page.getByText('My Ladder').click();
    await page.getByRole('button', { name: 'Edit' }).click();

    await page.getByPlaceholder('Name').fill('Fake');
    await pickRealm(page, 'Silvermoon');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await expect(
      page.getByText('Fake was not found. Check the name, realm and region.'),
    ).toBeVisible();

    await expect(page.locator('.character-edit-row')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Done' })).toBeDisabled();

    await page.getByPlaceholder('Name').fill('');
    await expect(page.getByRole('button', { name: 'Done' })).toBeEnabled();
  });

  test('edit: blocks saving while a typed character has not been added', async ({ page }) => {
    await mockOwnViews(page, [makeSimpleView(VALID_VIEW_ID, 'My Ladder')]);

    await page.goto('/');
    await page.getByText('My Ladder').click();
    await page.getByRole('button', { name: 'Edit' }).click();

    await expect(page.getByRole('button', { name: 'Done' })).toBeEnabled();
    await page.getByPlaceholder('Name').fill('Sylvanas');
    await expect(page.getByRole('button', { name: 'Done' })).toBeDisabled();
  });
});

const arthas: WowProfile = { ...mockCharacter, id: 1, name: 'Arthas', score: 3000 };
const jaina: WowProfile = { ...mockCharacter, id: 2, name: 'Jaina', score: 2800 };
const sylvanas: WowProfile = {
  ...mockCharacter,
  id: 3,
  name: 'Sylvanas',
  realm: 'Silvermoon',
  score: 2500,
};

// The row's toggle carries the character's name, and their sync status while it lasts.
const rowOf = (page: Page, name: string) => page.getByRole('button').filter({ hasText: name });

test.describe('WoW Retail: editing a ladder', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);
  });

  test('the owner removes and adds characters, who sync in place', async ({ page }) => {
    const backend = await mockLadderBackend<WowProfile, WowEntity>(page, {
      game: 'WOW',
      members: [arthas, jaina],
    });
    backend.operationStatus = 'PENDING';

    await page.goto(`/wow/${VALID_VIEW_ID}`);
    await page.getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit your ladder' });
    await dialog
      .locator('.character-edit-row')
      .filter({ hasText: 'Jaina' })
      .getByRole('button', { name: 'Delete' })
      .click();
    await dialog.getByPlaceholder('Name', { exact: true }).fill('Sylvanas');
    await pickRealm(page, 'Silvermoon');
    await dialog.getByRole('button', { name: 'Add', exact: true }).click();
    await dialog.getByRole('button', { name: 'Done' }).click();

    await expect(dialog).toBeHidden();
    // Retail lists a ladder's characters newest first.
    expect(backend.edited()).toEqual({
      name: 'My Ladder',
      entities: [
        { type: 'wow', name: 'Sylvanas', region: 'eu', realm: 'silvermoon' },
        { type: 'wow', name: 'Arthas', region: 'eu', realm: 'tarren-mill' },
      ],
      published: true,
      featured: false,
      game: 'WOW',
    } satisfies LadderRequest<WowEntity>);
    await expect(rowOf(page, 'Sylvanas')).toContainText('Syncing…');
    await expect(rowOf(page, 'Jaina')).toContainText('Deleting…');

    backend.members = [arthas, sylvanas];
    backend.operationStatus = 'COMPLETED';

    await expect(rowOf(page, 'Sylvanas')).toContainText('2,500');
    await expect(page.getByText(/Syncing…|Deleting…/)).toHaveCount(0);
    await expect(rowOf(page, 'Jaina')).toHaveCount(0);
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
      const backend = await mockLadderBackend<WowProfile, WowEntity>(page, {
        game: 'WOW',
        members: [arthas],
      });
      backend.operationStatus = status;

      await page.goto(`/wow/${VALID_VIEW_ID}`);
      await page.getByRole('button', { name: 'Edit' }).click();
      const editDialog = page.getByRole('dialog', { name: 'Edit your ladder' });
      await editDialog.getByPlaceholder('Name', { exact: true }).fill('Sylvanas');
      await pickRealm(page, 'Silvermoon');
      await editDialog.getByRole('button', { name: 'Add', exact: true }).click();
      await editDialog.getByRole('button', { name: 'Done' }).click();

      const errorDialog = page.getByRole('dialog', { name: "Some characters couldn't be synced" });
      await expect(errorDialog.getByText('Sylvanas')).toBeVisible();
      await expect(page.getByText('Syncing…')).toHaveCount(0);
      await errorDialog.getByRole('button', { name: 'Got it' }).click();
      await expect(errorDialog).toBeHidden();
    });
  }
});
