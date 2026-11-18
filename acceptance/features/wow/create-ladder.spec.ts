import { test, expect } from '@playwright/test';
import { seedAuth } from '../../mocks/account';
import { mockOwnViews } from '../../mocks/views';
import { mockEntitiesExist, mockStaticData } from '../../mocks/wow';
import { API } from '../../constants';
import { pickRealm } from './helpers';
import { WowProfile } from '@/games/wow/retail/api/wow-types';
import { LadderRequest, mockLadderBackend } from '../../mocks/ladders';
import { WowEntity } from '../../mocks/wow';

test.describe('create view', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);
    await mockOwnViews(page, []);
    await mockEntitiesExist(page);
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
});

test.describe('WoW Retail: creating a ladder', () => {
  test('the owner creates a ladder from name and realm, and it syncs into their list', async ({
    page,
  }) => {
    await seedAuth(page);
    await mockStaticData(page);
    const backend = await mockLadderBackend<WowProfile, WowEntity>(page, {
      game: 'WOW',
      ladders: [],
    });
    backend.operationStatus = 'PENDING';

    await page.goto('/wow');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();
    await page.getByPlaceholder('e.g., Main Push Team').fill('Push Crew');
    await page.getByPlaceholder('Name', { exact: true }).fill('Arthas');
    await pickRealm(page, 'Tarren Mill');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByTitle('Character found')).toBeVisible();
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Push Crew' })).toBeVisible();
    await expect(page.getByText('Synchronizing with server...')).toBeVisible();
    expect(backend.created()).toEqual({
      name: 'Push Crew',
      entities: [{ type: 'wow', name: 'Arthas', region: 'eu', realm: 'tarren-mill' }],
      published: true,
      featured: false,
      game: 'WOW',
    } satisfies LadderRequest<WowEntity>);

    backend.operationStatus = 'COMPLETED';

    await expect(page.getByText('Synchronizing with server...')).toBeHidden();
    await expect(page.getByTitle('Delete view')).toBeVisible();
  });
});
