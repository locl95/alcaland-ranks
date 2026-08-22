import { Page } from '@playwright/test';

export async function pickRealm(page: Page, label: string, nth = 0) {
  await page.getByLabel('Realm').nth(nth).fill(label.slice(0, 3));
  await page.getByRole('option', { name: label, exact: true }).click();
}
