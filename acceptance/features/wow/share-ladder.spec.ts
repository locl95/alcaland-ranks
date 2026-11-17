import { test, expect } from '@playwright/test';
import { seedAuth } from '../../mocks/account';

import { mockEntitiesExist, mockViewDetailApis } from '../../mocks/wow';
import { VALID_VIEW_ID } from '../../constants';
import { WowProfile } from '@/games/wow/retail/api/wow-types';
import { mockLadderBackend } from '../../mocks/ladders';
import { mockCharacter, mockStaticData, WowEntity } from '../../mocks/wow';

test.describe('WoW shared ladder', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockViewDetailApis(page);
    await mockEntitiesExist(page);
  });

  test('a ladder link shared before game paths existed opens under /wow', async ({ page }) => {
    await page.goto(`/${VALID_VIEW_ID}`);

    await expect(page).toHaveURL(`/wow/${VALID_VIEW_ID}`);
    await expect(page.getByText('Arthas').first()).toBeVisible();
  });
});

test.describe('WoW Retail: a shared ladder', () => {
  test('someone else opening a shared link sees the ladder, without the Edit button', async ({
    page,
  }) => {
    await seedAuth(page);
    await mockStaticData(page);
    await mockLadderBackend<WowProfile, WowEntity>(page, {
      game: 'WOW',
      members: [mockCharacter],
      owner: null,
    });

    await page.goto(`/wow/${VALID_VIEW_ID}`);

    await expect(page.getByText('Arthas').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  });
});
