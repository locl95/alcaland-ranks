import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/app/hooks.ts";
import { selectUsername } from "@/app/authSlice.ts";
import { userRequest } from "@/shared/api/httpClient.ts";
import { RaiderioProfile } from "@/features/views/api/raiderio.ts";
import { ViewRequest } from "@/features/views/api/view-types.ts";
import { haveSameCharacters } from "@/features/views/utils.ts";
import {
  viewKeys,
  fetchViewData,
  fetchCachedViewData,
  fetchWowStatic,
  pollOperation,
} from "@/features/views/api/viewQueries.ts";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const characterKey = (c: { name: string }) => c.name.toLowerCase();

export function useViewDetail(
  viewId: string | undefined,
  owner: string | null,
  initialEntitiesCount: number,
) {
  const queryClient = useQueryClient();
  const username = useAppSelector(selectUsername);

  // Pending chars drive the ladder's syncing state for both adds and deletes:
  //   - Add: new chars have score: null → shown as "syncing" in the ladder.
  //   - Delete: removed chars are kept in the list with score: null → shown as
  //     "syncing" until the operation resolves, then drop out of the ladder.
  const [pendingChars, setPendingChars] = useState<RaiderioProfile[] | null>(null);
  const [syncError, setSyncError] = useState<RaiderioProfile[] | null>(null);

  const isViewIdValid = !!viewId && UUID_REGEX.test(viewId);
  const safeViewId = viewId ?? "";

  const { data: rawViewData, isLoading } = useQuery({
    queryKey: viewKeys.data(safeViewId),
    queryFn: () => fetchViewData(safeViewId),
    enabled: isViewIdValid,
    refetchInterval: (query) => {
      const data = query.state.data;
      const isSyncingInitial = data === undefined && initialEntitiesCount > 0;
      const hasPendingCharacters = data?.data?.some((c) => c.score === null);
      return hasPendingCharacters || isSyncingInitial ? 3000 : false;
    },
  });

  const { data: cachedData } = useQuery({
    queryKey: viewKeys.cachedData(safeViewId),
    queryFn: () => fetchCachedViewData(safeViewId),
    enabled: isViewIdValid,
    staleTime: Infinity,
  });

  const { data: season } = useQuery({
    queryKey: viewKeys.static(),
    queryFn: fetchWowStatic,
    staleTime: Infinity,
  });

  const profiles = useMemo(() => {
    const apiData = rawViewData?.data ?? [];
    if (!pendingChars) return apiData;
    const apiByKey = new Map(apiData.map((c) => [characterKey(c), c]));
    return pendingChars.map((c) => {
      // Preserve score: null — it signals a pending add or a pending delete.
      // Without this, the API version (with a real score) would overwrite the indicator.
      if (c.score === null) return c;
      return apiByKey.get(characterKey(c)) ?? c;
    });
  }, [rawViewData, pendingChars]);

  const saveCharacters = (characters: RaiderioProfile[]) => {
    if (haveSameCharacters(characters, profiles)) return;
    setSyncError(null);

    const request: ViewRequest = {
      name: rawViewData?.viewName ?? "",
      entities: characters.map((c) => ({
        name: c.name,
        region: c.region,
        realm: c.realm,
        type: "com.kos.entities.domain.WowEntityRequest",
      })),
      published: true,
      featured: false,
      game: "WOW",
    };

    const hasNewChars = characters.some((c) => c.score === null);

    if (hasNewChars) {
      // ADD path: show characters immediately in the ladder with a syncing indicator.
      // Polling runs in the background; the dialog is already closed by the caller.
      setPendingChars(characters);
      userRequest<{ id: string }>("PUT", `/views/${safeViewId}`, request)
        .then(({ id: operationId }) => pollOperation(operationId))
        .then(async () => {
          setPendingChars(null);
          queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
          const freshData = await fetchViewData(safeViewId).catch(() => null);
          if (freshData) {
            queryClient.setQueryData(viewKeys.data(safeViewId), freshData);
            const synced = new Set((freshData.data ?? []).map(characterKey));
            const failed = characters.filter((c) => !synced.has(characterKey(c)));
            if (failed.length > 0) setSyncError(failed);
          } else {
            queryClient.invalidateQueries({ queryKey: viewKeys.data(safeViewId) });
          }
        })
        .catch(() => {
          setPendingChars(null);
          queryClient.invalidateQueries({ queryKey: viewKeys.data(safeViewId) });
        });
    } else {
      // DELETE path: keep the full list visible but mark removed chars with score: null
      // so the ladder shows them with the syncing indicator until the operation resolves.
      const removedKeys = new Set(
        profiles
          .filter((p) => !characters.some((c) => characterKey(c) === characterKey(p)))
          .map(characterKey),
      );
      setPendingChars(
        profiles.map((c) => (removedKeys.has(characterKey(c)) ? { ...c, score: null } : c)),
      );
      userRequest<{ id: string }>("PUT", `/views/${safeViewId}`, request)
        .then(({ id: operationId }) => pollOperation(operationId))
        .then(async () => {
          setPendingChars(null);
          queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
          const freshData = await fetchViewData(safeViewId).catch(() => null);
          if (freshData) {
            queryClient.setQueryData(viewKeys.data(safeViewId), freshData);
          } else {
            queryClient.invalidateQueries({ queryKey: viewKeys.data(safeViewId) });
          }
        })
        .catch(() => {
          setPendingChars(null);
          queryClient.invalidateQueries({ queryKey: viewKeys.data(safeViewId) });
        });
    }
  };

  return {
    profiles,
    cachedProfiles: cachedData?.data ?? [],
    viewName: rawViewData?.viewName ?? "",
    season: season ?? null,
    initialized: !isLoading,
    hasReceivedData: rawViewData !== undefined,
    isSyncing: pendingChars !== null,
    syncError,
    canEdit: username !== null && username === owner,
    isViewIdValid,
    saveCharacters,
    clearSyncError: () => setSyncError(null),
  };
}
