import { Page, Route } from '@playwright/test';
import { Game, SimpleView } from '@/features/views/api/view-types';
import { API } from '../constants';

export function makeSimpleView(
  id: string,
  name: string,
  owner = 'testuser',
  game: Game = 'WOW',
): SimpleView {
  return {
    id,
    name,
    owner,
    published: false,
    entitiesIds: [1, 2],
    game,
    featured: false,
    extraArguments: null,
  };
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

export async function mockOwnViews(page: Page, views: SimpleView[] = [], game = 'wow') {
  await page.route(`${API}/views?game=${game}&page=*`, (route) => fulfillPage(route, views));
}
