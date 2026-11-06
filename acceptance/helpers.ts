import { Page } from '@playwright/test';

/** Wheels over the page background and reports where it ended up. */
export async function wheelBackground(page: Page, delta = 600) {
  await page.mouse.move(20, 300);
  await page.mouse.wheel(0, delta);
  await page.waitForTimeout(200);
  return page.evaluate(() => window.scrollY);
}
