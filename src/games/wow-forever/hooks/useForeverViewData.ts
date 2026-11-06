import { useQuery } from '@tanstack/react-query';
import { fetchCachedViewData, fetchViewData, viewKeys } from '@/features/views/api/viewQueries.ts';
import { isViewId } from '@/features/views/utils.ts';
import { ForeverCharacter } from '@/games/wow-forever/api/forever-types.ts';

export function useForeverViewData(viewId: string | undefined) {
  const isValid = isViewId(viewId);
  const safeViewId = viewId ?? '';

  const { data, isLoading } = useQuery({
    queryKey: viewKeys.data(safeViewId),
    queryFn: () => fetchViewData<ForeverCharacter>(safeViewId),
    enabled: isValid,
  });

  const { data: cachedData } = useQuery({
    queryKey: viewKeys.cachedData(safeViewId),
    queryFn: () => fetchCachedViewData<ForeverCharacter>(safeViewId),
    enabled: isValid,
    staleTime: Infinity,
  });

  return {
    isValid,
    isLoading,
    viewName: data?.viewName ?? '',
    characters: data?.data ?? [],
    cachedCharacters: cachedData?.data ?? [],
  };
}
