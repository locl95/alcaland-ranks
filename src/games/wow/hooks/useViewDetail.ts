import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WowProfile } from '@/games/wow/api/wow-types.ts';
import { isViewId } from '@/features/views/utils.ts';
import { characterKey, toRealmSlug } from '@/games/wow/utils.ts';
import { viewKeys, fetchViewData, fetchCachedViewData } from '@/features/views/api/viewQueries.ts';
import { useStaticData } from '@/games/wow/hooks/useStaticData.ts';
import { useView } from '@/features/views/hooks/useView.ts';
import { EntityStatus, useSaveEntities } from '@/features/views/hooks/useSaveEntities.ts';

const REFETCH_INTERVAL = 2000;

export function useViewDetail(viewId: string | undefined) {
  const isValidViewId = isViewId(viewId);
  const safeViewId = viewId ?? '';

  const { data: viewData, isLoading } = useQuery({
    queryKey: viewKeys.data(safeViewId),
    queryFn: () => fetchViewData<WowProfile>(safeViewId),
    enabled: isValidViewId,
    refetchInterval: (query) => {
      const hasPendingCharacters = query.state.data?.data?.some((c) => c.score === null);
      return hasPendingCharacters ? REFETCH_INTERVAL : false;
    },
  });

  const { data: cachedViewData } = useQuery({
    queryKey: viewKeys.cachedData(safeViewId),
    queryFn: () => fetchCachedViewData<WowProfile>(safeViewId),
    enabled: isValidViewId,
    staleTime: Infinity,
  });

  const { data: season } = useStaticData();

  const { view, isOwner } = useView(viewId);

  const viewName = viewData?.viewName ?? '';
  const { pending, failed, isSaving, save, clearFailed } = useSaveEntities(
    viewId,
    viewName,
    viewData?.data ?? [],
    {
      game: 'WOW',
      noun: 'characters',
      fromData: (profile: WowProfile) => profile,
      key: characterKey,
      toRequest: (c) => ({
        name: c.name,
        region: c.region,
        realm: toRealmSlug(c.realm, c.region),
        type: 'wow',
      }),
    },
  );

  // Pending characters stay in the ladder, scoreless so they sort last, until the save ends.
  const { profiles, pendingStatuses } = useMemo(() => {
    const statuses = new Map<string, EntityStatus>(
      pending.map((p) => [characterKey(p.entity), p.status]),
    );
    return {
      pendingStatuses: statuses,
      profiles: [
        ...(viewData?.data ?? []).filter((c) => !statuses.has(characterKey(c))),
        ...pending.map((p) => ({ ...p.entity, score: null })),
      ],
    };
  }, [viewData, pending]);

  return {
    profiles,
    pendingStatuses,
    cachedProfiles: cachedViewData?.data ?? [],
    viewName,
    season: season ?? null,
    initialized: !isLoading,
    isSyncing: isSaving,
    syncError: failed,
    canEdit: isOwner && !view?.extraArguments?.isGuild,
    isViewIdValid: isValidViewId,
    saveCharacters: save,
    clearSyncError: clearFailed,
  };
}
