import { Page } from '@playwright/test';
import { WowProfile, Season, ViewData } from '@/games/wow/retail/api/wow-types';
import { API, VALID_VIEW_ID } from '../constants';

export const mockCharacter: WowProfile = {
  id: 1,
  name: 'Arthas',
  realm: 'Tarren Mill',
  region: 'eu',
  score: 3000,
  class: 'Death Knight',
  spec: 'Frost',
  quantile: 1,
  race: 'Human',
  faction: 'alliance',
  equippedItemLevel: 330,
  mythicPlusBestRuns: [],
  mythicPlusRecentRuns: [],
  mythicPlusRanks: {
    overall: { world: 1, region: 1, realm: 1 },
    class: { world: 1, region: 1, realm: 1 },
    specs: [],
  },
};

export const mockSeason: Season = {
  isCurrentSeason: true,
  slug: 'midnight-season-1',
  name: 'Midnight Season 1',
  blizzardSeasonId: 1,
  dungeons: [
    {
      name: 'Siege of Boralus',
      shortName: 'SIEGE',
      dungeonId: 1,
      icon: 'https://cdn.raiderio.net/images/dungeons/siege-of-boralus.jpg',
    },
  ],
};

export async function mockStaticData(page: Page) {
  await page.route(`${API}/sources/wow/static`, (route) => route.fulfill({ json: mockSeason }));
}

export async function mockEntitiesExist(page: Page) {
  await page.route(`${API}/entities/exists`, async (route) => {
    const { entities } = route.request().postDataJSON() as {
      entities: { name: string; region: string; realm: string }[];
    };
    await route.fulfill({
      json: {
        exist: entities.map(({ name, region, realm }) => ({ name, region, realm })),
        nonExisting: [],
        unchecked: [],
      },
    });
  });
}

export const viewData: ViewData = { data: [mockCharacter], viewName: 'My Ladder' };
export const emptyViewData: ViewData = { data: [], viewName: 'My Ladder' };

export const makeLadder = (count: number): {
    viewName: string;
    data: {
        id: number;
        name: string;
        score: number;
        mythicPlusBestRuns: {
            run: {
                runId: number;
                dungeon: string;
                shortName: string;
                keyLevel: number;
                upgrades: number;
                dateCompleted: string;
                clearTimeMs: number;
                dungeonTimeMs: number;
                score: number;
                url: string;
                affixes: never[]
            };
            details: never[]
        }[]
    }[]
} => ({
  viewName: 'My Ladder',
  data: Array.from({ length: count }, (_, i) => ({
    ...mockCharacter,
    id: i + 1,
    name: `Char${i + 1}`,
    score: 3000 - i * 10,
    mythicPlusBestRuns: [
      {
        run: {
          runId: i + 1,
          dungeon: 'Siege of Boralus',
          shortName: 'SIEGE',
          keyLevel: 10,
          upgrades: 1,
          dateCompleted: '2026-01-01T00:00:00.000Z',
          clearTimeMs: 1_800_000,
          dungeonTimeMs: 2_000_000,
          score: 100 + i,
          url: 'https://raider.io/run',
          affixes: [],
        },
        details: [],
      },
    ],
  })),
});

export async function mockViewDetailApis(page: Page, data = viewData) {
  await page.route(`${API}/views/${VALID_VIEW_ID}/data`, (route) => route.fulfill({ json: data }));
  await page.route(`${API}/views/${VALID_VIEW_ID}/cached-data`, (route) =>
    route.fulfill({ json: emptyViewData }),
  );
  await page.route(`${API}/sources/wow/static`, (route) => route.fulfill({ json: mockSeason }));
}
