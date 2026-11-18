// Layout rule: on a phone, a Forever row still shows the levels a character gained, inside the
// level column. Phones hid every gain until the row was rearranged to make room for this one.
import { test, expect } from '@playwright/test';
import { seedAuth } from '../mocks/account';
import { mockForeverLadder } from '../mocks/wow-forever';
import { VALID_VIEW_ID } from '../constants';

test.describe('a WoW Forever ladder on a phone', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockForeverLadder(page);
  });

  test('on a phone, still shows the levels gained, inside the level column', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/wow-forever/${VALID_VIEW_ID}`);

    const daxan = page.getByRole('listitem').nth(0);
    const gain = daxan.getByTitle('Levels gained since the last snapshot');
    await expect(gain).toHaveText('+12');
    await expect(gain).toBeVisible();

    const column = (await page.getByRole('button', { name: /^Level/ }).boundingBox())!;
    const { x, width } = (await gain.boundingBox())!;
    expect(x + width).toBeLessThanOrEqual(column.x + column.width);
  });
});
