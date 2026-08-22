import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/components/toaster/toast.ts';
import { useAppSelector } from '@/app/hooks.ts';
import { selectUsername } from '@/app/authSlice.ts';
import { userRequest } from '@/shared/api/httpClient.ts';
import { RaiderioProfile } from '@/features/views/api/raiderio.ts';
import { OperationResult, ViewRequest } from '@/features/views/api/view-types.ts';
import { haveSameCharacters, toRealmSlug } from '@/features/views/utils.ts';
import {
  viewKeys,
  fetchViewData,
  fetchCachedViewData,
  pollOperation,
} from '@/features/views/api/viewQueries.ts';
import { useStaticData } from '@/features/views/hooks/useStaticData.ts';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const getCharacterName = (c: { name: string }) => c.name.toLowerCase();
const REFETCH_INTERVAL = 2000;

export function useViewDetail(viewId: string | undefined, owner: string | null) {
  const queryClient = useQueryClient();
  const username = useAppSelector(selectUsername);
  const { showError } = useToast();

  // Pending chars drive the ladder's syncing state for both adds and deletes:
  //   - Add: new chars have score: null → shown as "syncing" in the ladder.
  //   - Delete: removed chars are kept in the list with score: null → shown as
  //     "syncing" until the operation resolves, then drop out of the ladder.
  const [pendingCharacters, setPendingCharacters] = useState<RaiderioProfile[] | null>(null);
  const [syncError, setSyncError] = useState<RaiderioProfile[] | null>(null);

  const isValidViewId = !!viewId && UUID_REGEX.test(viewId);
  const safeViewId = viewId ?? '';

  const { data: viewData, isLoading } = useQuery({
    queryKey: viewKeys.data(safeViewId),
    queryFn: () => fetchViewData(safeViewId),
    enabled: isValidViewId,
    refetchInterval: (query) => {
      const hasPendingCharacters = query.state.data?.data?.some((c) => c.score === null);
      return hasPendingCharacters ? REFETCH_INTERVAL : false;
    },
  });

  const { data: cachedViewData } = useQuery({
    queryKey: viewKeys.cachedData(safeViewId),
    queryFn: () => fetchCachedViewData(safeViewId),
    enabled: isValidViewId,
    staleTime: Infinity,
  });

  const { data: season } = useStaticData();

  const profiles = useMemo(() => {
    const raiderioProfiles = viewData?.data ?? [];
    if (!pendingCharacters) return raiderioProfiles;
    const raiderioProfilesMap = new Map(raiderioProfiles.map((c) => [getCharacterName(c), c]));
    return pendingCharacters.map((c) => {
      // Preserve score: null — it signals a pending add or a pending delete.
      // Without this, the API version (with a real score) would overwrite the indicator.
      if (c.score === null) return c;
      return raiderioProfilesMap.get(getCharacterName(c)) ?? c;
    });
  }, [viewData, pendingCharacters]);

  function handleSaveCharacters(characters: RaiderioProfile[], request: ViewRequest) {
    const submittedCharacters = new Set(characters.map(getCharacterName));
    const deletedCharacters = profiles
      .filter((p) => !submittedCharacters.has(getCharacterName(p)))
      .map((p) => ({ ...p, score: null }));
    setPendingCharacters([...characters, ...deletedCharacters]);

    async function reconcileView(operation: OperationResult) {
      setPendingCharacters(null);
      queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
      const refetchedViewData = await fetchViewData(safeViewId).catch(() => null);
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

    userRequest<{ id: string }>('PUT', `/views/${safeViewId}`, request)
      .then(({ id: operationId }) => pollOperation(operationId))
      .then(async (operation) => {
        await reconcileView(operation);
      })
      .catch(() => {
        setPendingCharacters(null);
        queryClient.invalidateQueries({ queryKey: viewKeys.data(safeViewId) });
        showError('Failed to save changes — please try again');
      });
  }

  const saveCharacters = (characters: RaiderioProfile[]) => {
    if (haveSameCharacters(characters, profiles)) return;
    setSyncError(null);

    const request: ViewRequest = {
      name: viewData?.viewName ?? '',
      entities: characters.map((c) => ({
        name: c.name,
        region: c.region,
        // Characters already on the ladder carry a realm display name while the
        // picker produces a slug — the request must speak one language.
        realm: toRealmSlug(c.realm, c.region),
        type: 'com.kos.entities.domain.WowEntityRequest',
      })),
      published: true,
      featured: false,
      game: 'WOW',
    };

    handleSaveCharacters(characters, request);
  };

  return {
    profiles,
    cachedProfiles: cachedViewData?.data ?? [],
    viewName: viewData?.viewName ?? '',
    season: season ?? null,
    initialized: !isLoading,
    isSyncing: pendingCharacters !== null,
    syncError,
    canEdit: username !== null && username === owner,
    isViewIdValid: isValidViewId,
    saveCharacters,
    clearSyncError: () => setSyncError(null),
  };
}
