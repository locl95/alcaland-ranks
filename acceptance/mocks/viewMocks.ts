import { Page } from '@playwright/test';
import { SimpleView } from '@/features/views/api/view-types';
import { API } from '../constants';
import { mockSeason } from './raiderioMocks';

export function makeSimpleView(id: string, name: string, owner = 'testuser'): SimpleView {
  return {
    id,
    name,
    owner,
    published: false,
    entitiesIds: [1, 2],
    game: 'WOW',
    featured: false,
    extraArguments: null,
  };
}

export async function mockStaticData(page: Page) {
  await page.route(`${API}/sources/wow/static`, (route) =>
    route.fulfill({ json: mockSeason }),
  );
}

export async function mockFeaturedViews(page: Page, views: SimpleView[] = []) {
  await page.route(`${API}/views?game=wow&featured=true`, (route) =>
    route.fulfill({ json: { records: views } }),
  );
}

export async function mockOwnViews(page: Page, views: SimpleView[] = []) {
  await page.route(`${API}/views?game=wow`, (route) =>
    route.fulfill({ json: { records: views } }),
  );
}
