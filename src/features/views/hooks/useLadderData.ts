import { useQuery } from '@tanstack/react-query';
import { fetchCachedViewData, fetchViewData, viewKeys } from '@/features/views/api/viewQueries.ts';
import { isViewId } from '@/features/views/utils.ts';

/** A ladder's rows and its previous snapshot (`cached-data`), whatever the game's row is. */
export function useLadderData<T>(viewId: string | undefined) {
  const isValid = isViewId(viewId);
  const safeViewId = viewId ?? '';

  const { data, isLoading } = useQuery({
    queryKey: viewKeys.data(safeViewId),
    queryFn: () => fetchViewData<T>(safeViewId),
    enabled: isValid,
  });

  const { data: cachedData } = useQuery({
    queryKey: viewKeys.cachedData(safeViewId),
    queryFn: () => fetchCachedViewData<T>(safeViewId),
    enabled: isValid,
    staleTime: Infinity,
  });

  return {
    isValid,
    isLoading,
    viewName: data?.viewName ?? '',
    rows: data?.data ?? [],
    cachedRows: cachedData?.data ?? [],
  };
}
