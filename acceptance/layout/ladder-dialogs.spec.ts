// Layout rule: a ladder dialog's realm list opens hugging its own input and never resizes or
// scrolls the dialog around it. The list is position: fixed, and twice a transformed
// ancestor sent it somewhere else on the page.
import { test, expect, Locator, Page } from '@playwright/test';
import { seedAuth } from '../mocks/account';
import { makeSimpleView, mockOwnViews } from '../mocks/views';
import { mockEntitiesExist, mockStaticData, mockViewDetailApis } from '../mocks/wow';
import { VALID_VIEW_ID } from '../constants';

/**
 * The realm list is `position: fixed`, so any transformed ancestor silently
 * becomes its containing block and sends it somewhere else on the page.
 * Asserts it opens hugging its own input.
 */
async function expectListAnchoredToInput(page: Page, input: Locator) {
  const box = await input.boundingBox();
  const list = await page.getByRole('listbox').boundingBox();
  expect(box, 'input should be visible').not.toBeNull();
  expect(list, 'listbox should be visible').not.toBeNull();
  expect(Math.abs(list!.x - box!.x)).toBeLessThan(2);
  expect(list!.y).toBeGreaterThanOrEqual(box!.y + box!.height);
  expect(list!.y - (box!.y + box!.height)).toBeLessThan(12);
}

test.describe('a ladder dialog\'s realm list', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);
    await mockEntitiesExist(page);
  });

  test.describe('creating a ladder', () => {
    test.beforeEach(async ({ page }) => {
      await mockOwnViews(page, []);
    });

    test('the realm list opens anchored to its input and does not grow the dialog', async ({
      page,
    }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Create your first ladder' }).click();

      const input = page.getByLabel('Realm').first();
      await input.fill('sa');
      await expect(page.getByRole('listbox')).toBeVisible();
      await expect(page.getByRole('option', { name: 'Sanguino' })).toBeVisible();

      await expectListAnchoredToInput(page, input);

      const panelScrolls = await page
        .locator('.dialog-panel')
        .evaluate((el) => el.scrollHeight > el.clientHeight);
      expect(panelScrolls).toBe(false);
    });
  });

  test.describe('editing a ladder', () => {
    test.beforeEach(async ({ page }) => {
      await mockViewDetailApis(page);
    });

    test('edit: opening the realm list does not resize the dialog or show scrollbars', async ({
      page,
    }) => {
      await mockOwnViews(page, [makeSimpleView(VALID_VIEW_ID, 'My Ladder')]);

      await page.goto('/');
      await page.getByText('My Ladder').click();
      await page.getByRole('button', { name: 'Edit' }).click();

      const dialog = page.locator('.edit-view-panel');
      const before = await dialog.boundingBox();

      await page.getByLabel('Realm').click();
      await expect(page.getByRole('listbox')).toBeVisible();
      await expectListAnchoredToInput(page, page.getByLabel('Realm'));

      const after = await dialog.boundingBox();
      expect(after?.height).toBe(before?.height);

      const metrics = await page.getByRole('listbox').evaluate((el: HTMLElement) => {
        const style = getComputedStyle(el);
        const borders = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
        return {
          overflowsHorizontally: el.scrollWidth > el.clientWidth,
          scrollbarWidth: el.offsetWidth - el.clientWidth - borders,
          isScrollable: el.scrollHeight > el.clientHeight,
        };
      });
      expect(metrics.overflowsHorizontally).toBe(false);
      expect(metrics.scrollbarWidth).toBe(0);
      expect(metrics.isScrollable).toBe(true);
    });
  });
});
