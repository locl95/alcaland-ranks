import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/hooks.ts';
import { selectUsername } from '@/app/authSlice.ts';
import { viewKeys, fetchView } from '@/features/views/api/viewQueries.ts';
import { isViewId } from '@/features/views/utils.ts';

export function useView(viewId: string | undefined) {
  const username = useAppSelector(selectUsername);
  const safeViewId = viewId ?? '';

  const { data: view } = useQuery({
    queryKey: viewKeys.detail(safeViewId),
    queryFn: () => fetchView(safeViewId),
    enabled: isViewId(viewId) && username !== null,
    retry: false,
  });

  return {
    view: view ?? null,
    isOwner: username !== null && view?.owner === username,
  };
}
