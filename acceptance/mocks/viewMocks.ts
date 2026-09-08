import { Page, Route } from '@playwright/test';
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
  await page.route(`${API}/sources/wow/static`, (route) => route.fulfill({ json: mockSeason }));
}

function fulfillPage(route: Route, views: SimpleView[]) {
  const params = new URL(route.request().url()).searchParams;
  const page = Number(params.get('page') ?? 1);
  const limit = Number(params.get('limit') ?? views.length);
  const start = (page - 1) * limit;
  return route.fulfill({
    json: {
      metadata: { totalCount: views.length },
      records: views.slice(start, start + limit),
    },
  });
}

export async function mockFeaturedViews(page: Page, views: SimpleView[] = []) {
  await page.route(`${API}/views?game=wow&featured=true&page=*`, (route) =>
    fulfillPage(route, views),
  );
}

export async function mockOwnViews(page: Page, views: SimpleView[] = []) {
  await page.route(`${API}/views?game=wow&page=*`, (route) => fulfillPage(route, views));
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
