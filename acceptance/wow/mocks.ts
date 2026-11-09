import { Page } from '@playwright/test';
import { WowProfile, Season } from '@/games/wow/retail/api/wow-types';
import { API } from '../constants';

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
