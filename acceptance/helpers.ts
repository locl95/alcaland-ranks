import { expect, Locator, Page } from '@playwright/test';

export async function pickRealm(page: Page, label: string, nth = 0) {
  await page.getByLabel('Realm').nth(nth).fill(label.slice(0, 3));
  await page.getByRole('option', { name: label, exact: true }).click();
}

/** Wheels over the page background and reports where it ended up. */
export async function wheelBackground(page: Page, delta = 600) {
  await page.mouse.move(20, 300);
  await page.mouse.wheel(0, delta);
  await page.waitForTimeout(200);
  return page.evaluate(() => window.scrollY);
}

/**
 * The realm list is `position: fixed`, so any transformed ancestor silently
 * becomes its containing block and sends it somewhere else on the page.
 * Asserts it opens hugging its own input.
 */
export async function expectListAnchoredToInput(page: Page, input: Locator) {
  const box = await input.boundingBox();
  const list = await page.getByRole('listbox').boundingBox();
  expect(box, 'input should be visible').not.toBeNull();
  expect(list, 'listbox should be visible').not.toBeNull();
  expect(Math.abs(list!.x - box!.x)).toBeLessThan(2);
  expect(list!.y).toBeGreaterThanOrEqual(box!.y + box!.height);
  expect(list!.y - (box!.y + box!.height)).toBeLessThan(12);
}
