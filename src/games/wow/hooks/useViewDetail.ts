import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/components/toaster/toast.ts';
import { useAppSelector } from '@/app/hooks.ts';
import { selectUsername } from '@/app/authSlice.ts';
import { userRequest } from '@/shared/api/httpClient.ts';
import { ApiError } from '@/shared/api/ApiError.ts';
import { WowProfile } from '@/games/wow/api/wow-types.ts';
import { OperationResult, ViewRequest } from '@/features/views/api/view-types.ts';
import { isViewId } from '@/features/views/utils.ts';
import { haveSameCharacters, toRealmSlug } from '@/games/wow/utils.ts';
import {
  viewKeys,
  fetchView,
  fetchViewData,
  fetchCachedViewData,
  pollOperation,
} from '@/features/views/api/viewQueries.ts';
import { useStaticData } from '@/games/wow/hooks/useStaticData.ts';

const getCharacterName = (c: { name: string }) => c.name.toLowerCase();
const REFETCH_INTERVAL = 2000;

export function useViewDetail(viewId: string | undefined, owner: string | null, isGuild: boolean) {
  const queryClient = useQueryClient();
  const username = useAppSelector(selectUsername);
  const { showError } = useToast();

  const [pendingCharacters, setPendingCharacters] = useState<WowProfile[] | null>(null);
  const [syncError, setSyncError] = useState<WowProfile[] | null>(null);

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

  const { data: fetchedView } = useQuery({
    queryKey: viewKeys.detail(safeViewId),
    queryFn: () => fetchView(safeViewId),
    enabled: isValidViewId && owner === null && username !== null,
    retry: false,
  });

  const viewOwner = owner ?? fetchedView?.owner ?? null;
  const viewIsGuild = owner !== null ? isGuild : (fetchedView?.extraArguments?.isGuild ?? false);

  const profiles = useMemo(() => {
    const fetchedProfiles = viewData?.data ?? [];
    if (!pendingCharacters) return fetchedProfiles;
    const fetchedProfilesMap = new Map(fetchedProfiles.map((c) => [getCharacterName(c), c]));
    return pendingCharacters.map((c) => {
      if (c.score === null) return c;
      return fetchedProfilesMap.get(getCharacterName(c)) ?? c;
    });
  }, [viewData, pendingCharacters]);

  async function handleSaveCharacters(
    characters: WowProfile[],
    request: ViewRequest,
  ): Promise<string | null> {
    const submittedCharacters = new Set(characters.map(getCharacterName));
    const deletedCharacters = profiles
      .filter((p) => !submittedCharacters.has(getCharacterName(p)))
      .map((p) => ({ ...p, score: null }));

    async function reconcileView(operation: OperationResult) {
      setPendingCharacters(null);
      queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
      const refetchedViewData = await fetchViewData<WowProfile>(safeViewId).catch(() => null);
      if (refetchedViewData) {
        queryClient.setQueryData(viewKeys.data(safeViewId), refetchedViewData);
        if (operation.status === 'FAILED') {
          const synced = new Set((refetchedViewData.data ?? []).map(getCharacterName));
          const failedAdds = characters.filter((c) => !synced.has(getCharacterName(c)));
          const failedDeletes = (refetchedViewData.data ?? []).filter(
            (c) => !submittedCharacters.has(getCharacterName(c)),
          );
          const failed = [...failedAdds, ...failedDeletes];
          if (failed.length > 0) setSyncError(failed);
        }
      } else {
        queryClient.invalidateQueries({ queryKey: viewKeys.data(safeViewId) });
      }
    }

    let operationId: string;
    try {
      ({ id: operationId } = await userRequest<{ id: string }>(
        'PUT',
        `/views/${safeViewId}`,
        request,
      ));
    } catch (err) {
      return err instanceof ApiError && err.code === 'TOO_MANY_ENTITIES'
        ? 'This ladder has more characters than allowed.'
        : 'Failed to save changes — please try again';
    }

    setPendingCharacters([...characters, ...deletedCharacters]);
    pollOperation(operationId)
      .then(reconcileView)
      .catch(() => {
        setPendingCharacters(null);
        queryClient.invalidateQueries({ queryKey: viewKeys.data(safeViewId) });
        showError('Failed to save changes — please try again');
      });
    return null;
  }

  const saveCharacters = async (characters: WowProfile[]): Promise<string | null> => {
    if (haveSameCharacters(characters, profiles)) return null;
    setSyncError(null);

    const request: ViewRequest = {
      name: viewData?.viewName ?? '',
      entities: characters.map((c) => ({
        name: c.name,
        region: c.region,
        realm: toRealmSlug(c.realm, c.region),
        type: 'wow',
      })),
      published: true,
      featured: false,
      game: 'WOW',
    };

    return handleSaveCharacters(characters, request);
  };

  return {
    profiles,
    cachedProfiles: cachedViewData?.data ?? [],
    viewName: viewData?.viewName ?? '',
    season: season ?? null,
    initialized: !isLoading,
    isSyncing: pendingCharacters !== null,
    syncError,
    canEdit: username !== null && username === viewOwner && !viewIsGuild,
    isViewIdValid: isValidViewId,
    saveCharacters,
    clearSyncError: () => setSyncError(null),
  };
}
