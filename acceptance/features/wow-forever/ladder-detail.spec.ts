import { test, expect } from '@playwright/test';
import { seedAuth } from '../../mocks/account';
import { mockForeverLadder } from '../../mocks/wow-forever';
import { VALID_VIEW_ID } from '../../constants';

test.describe('WoW Forever ladder detail', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockForeverLadder(page);
  });

  test('opens a ladder from the landing, ranked by level', async ({ page }) => {
    await page.goto('/wow-forever');
    await page.getByText('Fresh Start').click();

    await expect(page).toHaveURL(`/wow-forever/${VALID_VIEW_ID}`);
    const rows = page.getByRole('listitem');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('Daxan Windfury');
    await expect(rows.nth(0)).toContainText('<TSALAB>');
    await expect(rows.nth(0)).toContainText('PvE');
    await expect(rows.nth(0)).toContainText('↑ 1');
    await expect(rows.nth(0)).toContainText('+12');
    await expect(rows.nth(1)).toContainText('Siempre Tarde');
    await expect(rows.nth(1)).toContainText('↓ 1');
    await expect(rows.nth(1)).not.toContainText('<');
  });

  test("clicking a row shows the character's equipment, with details on hover, and talents", async ({
    page,
  }) => {
    await page.goto(`/wow-forever/${VALID_VIEW_ID}`);

    await page.getByRole('button', { name: /Daxan Windfury/ }).click();
    const equipment = page.getByRole('region', { name: 'Equipment of Daxan Windfury' });
    await expect(equipment.getByRole('img', { name: 'Neck: empty' })).toBeVisible();

    await equipment.getByRole('button', { name: "Brawler's Leather Hood" }).hover();
    const tooltip = page.getByRole('dialog');
    await expect(tooltip).toContainText('Item Level 25');
    await expect(tooltip).toContainText('+8 Agility');
    await expect(tooltip).toContainText('Requires Level 20');

    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden();

    // Improved Channeling, 5 points, is the second talent of Arcane, the Mage's first tree.
    const talents = page.getByRole('region', { name: 'Talents of Daxan Windfury' });
    await expect(talents.getByTitle('Talents of Daxan Windfury on Wowhead')).toHaveAttribute(
      'src',
      /^https:\/\/www\.wowhead\.com\/forever\/talent-calc\/embed\/mage\/[a-z]+05$/,
    );
  });
});
