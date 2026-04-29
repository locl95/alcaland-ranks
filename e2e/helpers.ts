import { Page } from '@playwright/test';
import { SimpleView } from '@/features/views/api/view-types';
import { RaiderioProfile, Season } from '@/features/views/api/raiderio';

const API = 'http://localhost:8080/api';

// JWT with payload {"username":"testuser"} — signature is irrelevant for the frontend
export const TEST_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIn0.test-sig';
export const TEST_REFRESH_TOKEN = 'test-refresh-token';

export function makeSimpleView(id: string, name: string, owner = 'testuser'): SimpleView {
  return {
    id,
    name,
    owner,
    published: false,
    entitiesIds: ['char1', 'char2'],
    game: 'WOW',
    featured: false,
    extraArguments: null,
  };
}

export async function seedAuth(page: Page) {
  await page.addInitScript(
    ({ access, refresh }) => {
      localStorage.setItem('auth.accessToken', access);
      localStorage.setItem('auth.refreshToken', refresh);
    },
    { access: TEST_ACCESS_TOKEN, refresh: TEST_REFRESH_TOKEN },
  );
}

export async function mockFeaturedViews(page: Page, views: SimpleView[] = []) {
  await page.route(`${API}/views?game=wow&featured=true`, (route) =>
    route.fulfill({ json: { records: views } }),
  );
}

export const mockCharacter: RaiderioProfile = {
  id: 1,
  name: 'Arthas',
  realm: 'Tarren Mill',
  region: 'eu',
  score: 3000,
  class: 'Death Knight',
  spec: 'Frost',
  quantile: 1,
  mythicPlusBestRuns: [],
  mythicPlusRecentRuns: [],
  mythicPlusRanks: {
    overall: { world: 1, region: 1, realm: 1 },
    class: { world: 1, region: 1, realm: 1 },
    specs: [],
  },
};

export const mockSeason: Season = {
  is_main_season: true,
  slug: 'midnight-season-1',
  name: 'Midnight Season 1',
  blizzard_season_id: 1,
  dungeons: [{ name: 'Siege of Boralus', short_name: 'SIEGE', challenge_mode_id: 1 }],
};

export async function mockOwnViews(page: Page, views: SimpleView[] = []) {
  await page.route(`${API}/views?game=wow`, (route) =>
    route.fulfill({ json: { records: views } }),
  );
}
