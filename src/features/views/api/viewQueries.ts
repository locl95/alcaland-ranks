import { serviceGet, userRequest } from '@/shared/api/httpClient.ts';
import { GetViewsResponse, OperationResult } from '@/features/views/api/view-types.ts';
import { Season, ViewData } from '@/features/views/api/raiderio.ts';
import { View } from '@/features/views/model/view.ts';

export const viewKeys = {
  list: () => ['views', 'featured'] as const,
  ownList: () => ['views', 'own'] as const,
  data: (viewId: string) => ['viewData', viewId] as const,
  cachedData: (viewId: string) => ['viewCachedData', viewId] as const,
  static: () => ['wowStatic'] as const,
};

export const fetchViews = async (): Promise<View[]> => {
  const res = await serviceGet<GetViewsResponse>('/views?game=wow&featured=true');
  return res.records.map((v) => ({ operationId: null, simpleView: v, status: 'synced' }));
};

export const fetchOwnViews = async (): Promise<View[]> => {
  const res = await userRequest<GetViewsResponse>('GET', '/views?game=wow');
  return res.records.map((v) => ({ operationId: null, simpleView: v, status: 'synced' }));
};

export const fetchViewData = (viewId: string): Promise<ViewData> =>
  serviceGet<ViewData>(`/views/${viewId}/data`);

export const fetchCachedViewData = (viewId: string): Promise<ViewData> =>
  serviceGet<ViewData>(`/views/${viewId}/cached-data`);

export const fetchWowStatic = (): Promise<Season> => serviceGet<Season>(`/sources/wow/static`);

const fetchOperation = (operationId: string): Promise<OperationResult> =>
  serviceGet<OperationResult>(`/operations/${operationId}`);

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 30;

export async function pollOperation(operationId: string): Promise<OperationResult> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    const op = await fetchOperation(operationId);
    if (op.status !== 'PENDING') return op;
    await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  return { id: operationId, status: 'FAILED', reason: 'Operation timed out' };
}
