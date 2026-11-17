import { test, expect } from '@playwright/test';
import { seedAuth } from '../../mocks/account';
import { mockLolLadder } from '../../mocks/lol';
import { VALID_VIEW_ID } from '../../constants';

test.describe('League of Legends ladder detail', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockLolLadder(page);
  });

  test('opens a LoL ladder from the landing, ranked by Solo/Duo', async ({ page }) => {
    await page.goto('/lol');
    await page.getByText('Flex Squad').click();

    await expect(page).toHaveURL(`/lol/${VALID_VIEW_ID}`);
    await expect(page.getByText('1200 LP', { exact: true })).toBeVisible();
    await expect(page.getByText('40 LP', { exact: true })).toBeVisible();
  });

  test('switching to Flex keeps the queue in the link', async ({ page }) => {
    await page.goto(`/lol/${VALID_VIEW_ID}`);
    await page.getByRole('button', { name: 'Flex' }).click();

    await expect(page).toHaveURL(`/lol/${VALID_VIEW_ID}?queue=flex`);
    await expect(page.getByText('10 LP', { exact: true })).toBeVisible();
    await expect(page.getByText('Unranked')).toBeVisible();
  });

  test('a shared Flex link opens on Flex', async ({ page }) => {
    await page.goto(`/lol/${VALID_VIEW_ID}?queue=flex`);

    await expect(page.getByRole('button', { name: 'Flex' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByText('10 LP', { exact: true })).toBeVisible();
  });

  test('expands a player into their recent games and opens a matchup', async ({ page }) => {
    await page.goto(`/lol/${VALID_VIEW_ID}`);
    await page.getByRole('button', { name: /Faker/ }).click();

    await expect(page.getByText('Last 1 games')).toBeVisible();
    await page.getByRole('button', { name: /9\/1\/6/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Victory')).toBeVisible();
    await expect(dialog.getByText('2 / 7 / 3')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
