import { useQuery } from '@tanstack/react-query';
import { fetchCachedViewData, fetchViewData, viewKeys } from '@/features/views/api/viewQueries.ts';
import { isViewId } from '@/features/views/utils.ts';
import { LolPlayer } from '@/games/lol/api/lol-types.ts';

export function useLolViewData(viewId: string | undefined) {
  const isValid = isViewId(viewId);
  const safeViewId = viewId ?? '';

  const { data, isLoading } = useQuery({
    queryKey: viewKeys.data(safeViewId),
    queryFn: () => fetchViewData<LolPlayer>(safeViewId),
    enabled: isValid,
  });

  const { data: cachedData } = useQuery({
    queryKey: viewKeys.cachedData(safeViewId),
    queryFn: () => fetchCachedViewData<LolPlayer>(safeViewId),
    enabled: isValid,
    staleTime: Infinity,
  });

  return {
    isValid,
    isLoading,
    viewName: data?.viewName ?? '',
    players: data?.data ?? [],
    cachedPlayers: cachedData?.data ?? [],
  };
}
