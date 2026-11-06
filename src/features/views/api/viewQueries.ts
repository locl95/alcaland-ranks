import { serviceGet, userRequest } from '@/shared/api/httpClient.ts';
import { poll } from '@/shared/utils/poll.ts';
import {
  GetViewsResponse,
  OperationResult,
  ViewDataResponse,
  ViewResponse,
} from '@/features/views/api/view-types.ts';
import { View } from '@/features/views/model/view.ts';
import { GameSlug, gameQuery } from '@/shared/game/game.ts';

export const VIEWS_PAGE_SIZE = 10;

export const viewKeys = {
  ownList: () => ['views', 'own'] as const,
  ownListPage: (game: GameSlug, page: number) => ['views', 'own', game, page] as const,
  detail: (viewId: string) => ['view', viewId] as const,
  data: (viewId: string) => ['viewData', viewId] as const,
  cachedData: (viewId: string) => ['viewCachedData', viewId] as const,
};

export interface ViewsPage {
  views: View[];
  totalCount: number | null;
}

const viewsPath = (game: GameSlug, page: number) => {
  const params = new URLSearchParams({ game: gameQuery(game) });
  params.set('page', String(page));
  params.set('limit', String(VIEWS_PAGE_SIZE));
  params.set('include', 'metadata');
  return `/views?${params}`;
};

const toViewsPage = (res: GetViewsResponse): ViewsPage => ({
  views: res.records.map((v) => ({ operationId: null, simpleView: v, status: 'synced' })),
  totalCount: res.metadata?.totalCount ?? null,
});

export const fetchOwnViews = async (game: GameSlug, page: number): Promise<ViewsPage> =>
  toViewsPage(await userRequest<GetViewsResponse>('GET', viewsPath(game, page)));

export const fetchView = (viewId: string): Promise<ViewResponse> =>
  userRequest<ViewResponse>('GET', `/views/${viewId}`);

export const fetchViewData = <T>(viewId: string): Promise<ViewDataResponse<T>> =>
  serviceGet<ViewDataResponse<T>>(`/views/${viewId}/data`);

export const fetchCachedViewData = <T>(viewId: string): Promise<ViewDataResponse<T>> =>
  serviceGet<ViewDataResponse<T>>(`/views/${viewId}/cached-data`);

const fetchOperation = (operationId: string, signal?: AbortSignal): Promise<OperationResult> =>
  serviceGet<OperationResult>(`/operations/${operationId}`, signal);

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 30;

export type PolledOperation = OperationResult & { timedOut?: true };

interface PollOperationOptions {
  intervalMs?: number;
  maxAttempts?: number;
  signal?: AbortSignal;
}

export async function pollOperation(
  operationId: string,
  {
    intervalMs = POLL_INTERVAL_MS,
    maxAttempts = MAX_POLL_ATTEMPTS,
    signal,
  }: PollOperationOptions = {},
): Promise<PolledOperation> {
  return (
    (await poll(
      (sig) => fetchOperation(operationId, sig),
      (op) => op.status !== 'PENDING',
      intervalMs,
      maxAttempts,
      signal,
    )) ?? { id: operationId, status: 'FAILED', timedOut: true }
  );
}
