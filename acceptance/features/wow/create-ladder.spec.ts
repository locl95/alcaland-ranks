import { test, expect } from '@playwright/test';
import { seedAuth } from '../../mocks/account';
import { makeSimpleView, mockOwnViews } from '../../mocks/views';
import { mockEntitiesExist, mockStaticData } from '../../mocks/wow';
import { API, VALID_VIEW_ID } from '../../constants';
import { pickRealm } from './helpers';

test.describe('create view', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);
    await mockOwnViews(page, []);
    await mockEntitiesExist(page);
  });

  test('submits the form and shows the pending view in the list', async ({ page }) => {
    await page.route(`${API}/views`, (route) => route.fulfill({ json: { id: 'op-123' } }));
    // Keep the poll alive so the pending view stays visible during the assertion.
    await page.route(`${API}/operations/op-123`, (route) =>
      route.fulfill({ json: { id: 'op-123', status: 'PENDING' } }),
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();

    await page.getByPlaceholder('e.g., Main Push Team').fill('My New Ladder');
    await page.getByPlaceholder('Name').fill('Arthas');
    await pickRealm(page, 'Tarren Mill');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'My New Ladder' })).toBeVisible();
    await expect(page.getByText('Synchronizing with server...')).toBeVisible();
  });

  // The realm list used to be mouse-only because Enter on it submitted the
  // whole dialog. These two pin down that it no longer leaks either key.
  test('Enter picks a realm instead of submitting the dialog', async ({ page }) => {
    let createCalled = false;
    await page.route(`${API}/views`, (route) => {
      createCalled = true;
      return route.fulfill({ json: { id: 'op-kbd' } });
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();
    await page.getByLabel('Realm').first().fill('sangu');
    await expect(page.getByRole('option', { name: 'Sanguino' })).toBeVisible();

    await page.keyboard.press('Enter');

    await expect(page.getByLabel('Realm').first()).toHaveValue('Sanguino');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(page.getByText('Create new m+ ladder')).toBeVisible();
    expect(createCalled).toBe(false);
  });

  test('Escape closes the realm list before it closes the dialog', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();
    await page.getByLabel('Realm').first().fill('sangu');
    await expect(page.getByRole('listbox')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(page.getByText('Create new m+ ladder')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByText('Create new m+ ladder')).toHaveCount(0);
  });

  test('shows an error banner when the operation fails', async ({ page }) => {
    await page.route(`${API}/views`, (route) => route.fulfill({ json: { id: 'op-fail-123' } }));
    await page.route(`${API}/operations/op-fail-123`, (route) =>
      route.fulfill({ json: { id: 'op-fail-123', status: 'FAILED' } }),
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();

    await page.getByPlaceholder('e.g., Main Push Team').fill('My New Ladder');
    await page.getByPlaceholder('Name').fill('Arthas');
    await pickRealm(page, 'Tarren Mill');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('Failed to create ladder. Please try again.')).toBeVisible();
  });

  test('flags a character that does not exist and blocks submitting', async ({ page }) => {
    await page.route(`${API}/entities/exists`, (route) =>
      route.fulfill({
        json: {
          exist: [],
          nonExisting: [{ name: 'Fake', region: 'eu', realm: 'tarren-mill' }],
          unchecked: [],
        },
      }),
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();

    await page.getByPlaceholder('e.g., Main Push Team').fill('My New Ladder');
    await page.getByPlaceholder('Name').first().fill('Fake');
    await pickRealm(page, 'Tarren Mill');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await expect(page.getByTitle('Character not found')).toBeVisible();
    await expect(
      page.getByText('Fake was not found. Check the name, realm and region.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create', exact: true })).toBeDisabled();

    await page.getByTitle('Remove').click();
    await expect(
      page.getByText('Fake was not found. Check the name, realm and region.'),
    ).toHaveCount(0);
  });

  test('shows a found indicator and only submits verified characters', async ({ page }) => {
    await page.route(`${API}/views`, (route) => route.fulfill({ json: { id: 'op-123' } }));
    await page.route(`${API}/operations/op-123`, (route) =>
      route.fulfill({ json: { id: 'op-123', status: 'PENDING' } }),
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();

    await page.getByPlaceholder('e.g., Main Push Team').fill('My New Ladder');
    await page.getByPlaceholder('Name').first().fill('Arthas');
    await pickRealm(page, 'Tarren Mill');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await expect(page.getByTitle('Character found')).toBeVisible();

    await page.getByPlaceholder('Name').last().fill('Sylvanas');
    await expect(page.getByRole('button', { name: 'Create', exact: true })).toBeDisabled();

    const request = page.waitForRequest((r) => r.url().endsWith('/views') && r.method() === 'POST');
    await page.getByPlaceholder('Name').last().fill('');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    const entities = (await request).postDataJSON().entities;
    expect(entities).toHaveLength(1);
    expect(entities[0]).toMatchObject({ name: 'Arthas', realm: 'tarren-mill' });
  });

  test('replaces the pending view with the synced one after backend confirms it', async ({
    page,
  }) => {
    let created = false;

    await page.route(`${API}/views?game=wow&page=*`, (route) =>
      route.fulfill({
        json: { records: created ? [makeSimpleView(VALID_VIEW_ID, 'My New Ladder')] : [] },
      }),
    );
    await page.route(`${API}/views`, (route) => {
      created = true;
      route.fulfill({ json: { id: 'op-123', resourceId: VALID_VIEW_ID } });
    });
    await page.route(`${API}/operations/op-123`, (route) =>
      route.fulfill({ json: { id: 'op-123', status: 'COMPLETED', resourceId: VALID_VIEW_ID } }),
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();

    await page.getByPlaceholder('e.g., Main Push Team').fill('My New Ladder');
    await page.getByPlaceholder('Name').fill('Arthas');
    await pickRealm(page, 'Tarren Mill');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'My New Ladder' })).toBeVisible();
    await expect(page.getByText('Synchronizing with server...')).not.toBeVisible();
    await expect(page.getByTitle('Delete view')).toBeVisible();
  });
});
