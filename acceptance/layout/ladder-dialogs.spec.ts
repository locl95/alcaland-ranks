// Layout rules of the ladder dialogs:
// - the realm list opens hugging its own input and never resizes or scrolls the dialog
//   around it. The list is position: fixed, and twice a transformed ancestor sent it
//   somewhere else on the page.
// - an open dialog freezes the page behind it. Radix does it, and only a browser that
//   scrolls can show it: jsdom has no scrolling.
import { test, expect, Locator, Page } from '@playwright/test';
import { seedAuth } from '../mocks/account';
import { makeSimpleView, mockOwnViews } from '../mocks/views';
import { mockCharacter, mockEntitiesExist, mockStaticData, mockViewDetailApis } from '../mocks/wow';
import { VALID_VIEW_ID } from '../constants';
import { wheelBackground } from '../helpers';

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

test.describe("a ladder dialog's realm list", () => {
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

test.describe('an open ladder dialog', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);
    await mockEntitiesExist(page);
  });

  test('an open dialog freezes the page behind it', async ({ page }) => {
    const crowd = Array.from({ length: 25 }, (_, i) => ({
      ...mockCharacter,
      id: i + 1,
      name: `Char${i}`,
      score: 3000 - i * 30,
    }));
    await mockViewDetailApis(page, { data: crowd, viewName: 'My Ladder' });
    await mockOwnViews(page, [makeSimpleView(VALID_VIEW_ID, 'My Ladder')]);

    await page.setViewportSize({ width: 1200, height: 500 });
    await page.goto('/');
    await page.getByText('My Ladder').click();
    await expect(page.getByText('Char0').first()).toBeVisible();

    // Without this the assertion below would pass on a page that never scrolled.
    expect(await wheelBackground(page)).toBeGreaterThan(0);
    await page.evaluate(() => window.scrollTo(0, 0));

    await page.getByRole('button', { name: 'Edit' }).click();
    expect(await wheelBackground(page)).toBe(0);
  });
});
