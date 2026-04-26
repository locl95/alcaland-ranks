import { serviceGet } from "@/shared/api/httpClient.ts";
import { GetViewsResponse } from "@/features/views/api/view-types.ts";
import { Season, ViewData } from "@/features/views/api/raiderio.ts";
import { View } from "@/features/views/model/view.ts";

export const viewKeys = {
  list: () => ["views"] as const,
  data: (viewId: string) => ["viewData", viewId] as const,
  cachedData: (viewId: string) => ["viewCachedData", viewId] as const,
  static: () => ["wowStatic"] as const,
  editMeta: (viewId: string) => ["viewEditMeta", viewId] as const,
  syncError: (viewId: string) => ["viewSyncError", viewId] as const,
};

export const fetchViews = async (): Promise<View[]> => {
  const res = await serviceGet<GetViewsResponse>("/views?game=wow");
  return res.records.map((v) => ({ id: v.id, simpleView: v, isSynced: true }));
};

export const fetchViewData = (viewId: string): Promise<ViewData> =>
  serviceGet<ViewData>(`/views/${viewId}/data`);

export const fetchCachedViewData = (viewId: string): Promise<ViewData> =>
  serviceGet<ViewData>(`/views/${viewId}/cached-data`);

export const fetchWowStatic = (): Promise<Season> =>
  serviceGet<Season>(`/sources/wow/static`);
