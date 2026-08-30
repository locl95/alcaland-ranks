import { serviceGet, userRequest } from '@/shared/api/httpClient.ts';
import { poll } from '@/shared/utils/poll.ts';
import { GetViewsResponse, OperationResult } from '@/features/views/api/view-types.ts';
import { Season, ViewData } from '@/features/views/api/raiderio.ts';
import { View } from '@/features/views/model/view.ts';

export const VIEWS_PAGE_SIZE = 10;

export const viewKeys = {
  // The *Page keys are what actually get fetched; ownList is the prefix they share, used
  // only to invalidate every page of the own list at once.
  listPage: (page: number) => ['views', 'featured', page] as const,
  ownList: () => ['views', 'own'] as const,
  ownListPage: (page: number) => ['views', 'own', page] as const,
  data: (viewId: string) => ['viewData', viewId] as const,
  cachedData: (viewId: string) => ['viewCachedData', viewId] as const,
  static: () => ['wowStatic'] as const,
};

export interface ViewsPage {
  views: View[];
  totalCount: number | null;
}

const viewsPath = (page: number, featured = false) => {
  const params = new URLSearchParams({ game: 'wow' });
  if (featured) params.set('featured', 'true');
  params.set('page', String(page));
  params.set('limit', String(VIEWS_PAGE_SIZE));
  params.set('include', 'metadata');
  return `/views?${params}`;
};

const toViewsPage = (res: GetViewsResponse): ViewsPage => ({
  views: res.records.map((v) => ({ operationId: null, simpleView: v, status: 'synced' })),
  totalCount: res.metadata?.totalCount ?? null,
});

export const fetchViews = async (page: number): Promise<ViewsPage> =>
  toViewsPage(await serviceGet<GetViewsResponse>(viewsPath(page, true)));

export const fetchOwnViews = async (page: number): Promise<ViewsPage> =>
  toViewsPage(await userRequest<GetViewsResponse>('GET', viewsPath(page)));

export const fetchViewData = (viewId: string): Promise<ViewData> =>
  serviceGet<ViewData>(`/views/${viewId}/data`);

export const fetchCachedViewData = (viewId: string): Promise<ViewData> =>
  serviceGet<ViewData>(`/views/${viewId}/cached-data`);

export const fetchWowStatic = (): Promise<Season> => serviceGet<Season>(`/sources/wow/static`);

const fetchOperation = (operationId: string, signal?: AbortSignal): Promise<OperationResult> =>
  serviceGet<OperationResult>(`/operations/${operationId}`, signal);

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 30;

export async function pollOperation(operationId: string): Promise<OperationResult> {
  return (
    (await poll(
      (sig) => fetchOperation(operationId, sig),
      (op) => op.status !== 'PENDING',
      POLL_INTERVAL_MS,
      MAX_POLL_ATTEMPTS,
    )) ?? { id: operationId, status: 'FAILED', reason: 'Operation timed out' }
  );
}
