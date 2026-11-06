import { test, expect } from '@playwright/test';
import { seedAuth } from './mocks/authMocks';
import { makeSimpleView, mockOwnViews, mockStaticData } from './mocks/viewMocks';
import { API, VALID_VIEW_ID } from './constants';

const wowLadders = Array.from({ length: 15 }, (_, i) =>
  makeSimpleView(`w${i + 1}`, `WoW Ladder ${i + 1}`),
);
const lolLadder = makeSimpleView('l1', 'Flex Squad', 'testuser', 'LOL');

test.describe('League of Legends', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockStaticData(page);
    await mockOwnViews(page, wowLadders);
    await mockOwnViews(page, [lolLadder], 'lol');
  });

  test('the game switcher takes you to your LoL ladders, starting from their first page', async ({
    page,
  }) => {
    const lolPagesRequested: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname.endsWith('/views') && url.searchParams.get('game') === 'lol') {
        lolPagesRequested.push(url.searchParams.get('page')!);
      }
    });

    await page.goto('/wow');
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText('11–15 of 15')).toBeVisible();

    await page.getByRole('button', { name: 'World of Warcraft Retail' }).click();
    await page.getByRole('menuitem', { name: 'League of Legends' }).click();

    await expect(page).toHaveURL('/lol');
    await expect(page.getByText('Ranked ladder tracker')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Flex Squad' })).toBeVisible();
    await expect(page.getByText(/WoW Ladder/)).toHaveCount(0);
    expect(lolPagesRequested).toEqual(['1']);
  });

  test('creates a ladder from Riot IDs', async ({ page }) => {
    let createBody: unknown;
    await mockOwnViews(page, [], 'lol');
    await page.route(`${API}/entities/exists`, (route) =>
      route.fulfill({
        json: { exist: [{ name: 'Faker', tag: 'KR1' }], nonExisting: [], unchecked: [] },
      }),
    );
    await page.route(`${API}/views`, (route) => {
      createBody = route.request().postDataJSON();
      return route.fulfill({ json: { id: 'op-lol', resourceId: 'l2' } });
    });
    await page.route(`${API}/operations/op-lol`, (route) =>
      route.fulfill({ json: { id: 'op-lol', status: 'PENDING' } }),
    );

    await page.goto('/lol');
    await page.getByRole('button', { name: 'Create your first ladder' }).click();
    await page.getByPlaceholder('e.g., Friday Flex Squad').fill('Solo Grinders');
    await page.getByLabel('Riot ID').fill('Faker#KR1');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByTitle('Player found')).toBeVisible();
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Solo Grinders' })).toBeVisible();
    expect(createBody).toEqual({
      name: 'Solo Grinders',
      entities: [{ type: 'lol', name: 'Faker', tag: 'KR1' }],
      published: true,
      featured: false,
      game: 'LOL',
    });
  });
});

const lolPlayer = (name: string, solo: object | undefined, flex: object | undefined) => ({
  type: 'lol',
  summonerIcon: 1,
  summonerLevel: 300,
  summonerName: name,
  summonerTag: 'EUW',
  leagues: { SOLO_Q: solo, FLEX_Q: flex },
});

const midMatch = {
  id: 'EUW1_1',
  championId: 7,
  championName: 'Leblanc',
  individualPosition: 'MIDDLE',
  kills: 9,
  deaths: 1,
  assists: 6,
  wardsPlaced: 12,
  visionWardsBoughtInGame: 2,
  totalTimeSpentDead: 40,
  gameDuration: 1700,
  gameFinishedCorrectly: true,
  win: true,
  matchUp: { championId: 103, championName: 'Ahri', kills: 2, deaths: 7, assists: 3 },
};

const rankedLeague = (tier: string, rank: string, leaguePoints: number) => ({
  tier,
  rank,
  leaguePoints,
  gamesPlayed: 20,
  winrate: 0.55,
  teamPosition: 'MIDDLE',
  matches: [midMatch],
});

test.describe('League of Legends ladder', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockOwnViews(
      page,
      [makeSimpleView(VALID_VIEW_ID, 'Flex Squad', 'testuser', 'LOL')],
      'lol',
    );
    await page.route('https://ddragon.leagueoflegends.com/**', (route) =>
      route.request().url().endsWith('versions.json')
        ? route.fulfill({ json: ['15.1.1'] })
        : route.request().url().endsWith('champion.json')
          ? route.fulfill({ json: { data: {} } })
          : route.abort(),
    );
    await page.route(`${API}/views/${VALID_VIEW_ID}/data`, (route) =>
      route.fulfill({
        json: {
          viewName: 'Flex Squad',
          data: [
            lolPlayer('Faker', rankedLeague('CHALLENGER', 'I', 1200), undefined),
            lolPlayer('Caps', rankedLeague('DIAMOND', 'II', 40), rankedLeague('GOLD', 'I', 10)),
          ],
        },
      }),
    );
    await page.route(`${API}/views/${VALID_VIEW_ID}/cached-data`, (route) =>
      route.fulfill({ json: { viewName: 'Flex Squad', data: [] } }),
    );
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

  test('the owner removes and adds players, who sync in place', async ({ page }) => {
    let editBody: unknown;
    let operationDone = false;
    await page.route(`${API}/views/${VALID_VIEW_ID}`, (route) => {
      if (route.request().method() !== 'PUT') {
        return route.fulfill({ json: { owner: 'testuser' } });
      }
      editBody = route.request().postDataJSON();
      return route.fulfill({ json: { id: 'edit-op' } });
    });
    await page.route(`${API}/operations/edit-op`, (route) =>
      route.fulfill({
        json: { id: 'edit-op', status: operationDone ? 'COMPLETED' : 'PENDING' },
      }),
    );
    await page.route(`${API}/entities/exists`, (route) =>
      route.fulfill({
        json: { exist: [{ name: 'Chovy', tag: 'KR2' }], nonExisting: [], unchecked: [] },
      }),
    );

    await page.goto('/lol');
    await page.getByText('Flex Squad').click();
    await page.getByRole('button', { name: 'Edit' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Faker#EUW')).toBeVisible();
    await dialog.getByRole('button', { name: 'Remove Caps#EUW' }).click();
    await dialog.getByLabel('Riot ID').fill('Chovy#KR2');
    await dialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(dialog.getByTitle('Player found')).toBeVisible();
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).toBeHidden();
    expect(editBody).toEqual({
      name: 'Flex Squad',
      entities: [
        { type: 'lol', name: 'Faker', tag: 'EUW' },
        { type: 'lol', name: 'Chovy', tag: 'KR2' },
      ],
      published: true,
      featured: false,
      game: 'LOL',
    });
    await expect(page.getByRole('row', { name: /Chovy #KR2 Syncing…/ })).toBeVisible();
    await expect(page.getByRole('row', { name: /Caps #EUW Deleting…/ })).toBeVisible();

    await page.route(`${API}/views/${VALID_VIEW_ID}/data`, (route) =>
      route.fulfill({
        json: {
          viewName: 'Flex Squad',
          data: [
            lolPlayer('Faker', rankedLeague('CHALLENGER', 'I', 1200), undefined),
            {
              ...lolPlayer('Chovy', rankedLeague('GRANDMASTER', 'I', 900), undefined),
              summonerTag: 'KR2',
            },
          ],
        },
      }),
    );
    operationDone = true;

    await expect(page.getByText('900 LP', { exact: true })).toBeVisible();
    await expect(page.getByText(/Syncing…|Deleting…/)).toHaveCount(0);
    await expect(page.getByText('Caps')).toHaveCount(0);
  });

  test('someone else opening a shared link does not get the Edit button', async ({ page }) => {
    await page.route(`${API}/views/${VALID_VIEW_ID}`, (route) => route.fulfill({ status: 403 }));

    await page.goto(`/lol/${VALID_VIEW_ID}`);

    await expect(page.getByText('1200 LP', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  });
});
