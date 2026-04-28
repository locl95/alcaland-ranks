import { useMemo, useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/app/hooks.ts";
import { selectUsername } from "@/app/authSlice.ts";
import { userRequestVoid } from "@/shared/api/httpClient.ts";
import { RaiderioProfile } from "@/features/views/api/raiderio.ts";
import { View } from "@/features/views/model/view.ts";
import { ViewRequest } from "@/features/views/api/view-types.ts";
import { haveSameCharacters } from "@/features/views/utils.ts";
import {
  viewKeys,
  fetchViewData,
  fetchCachedViewData,
  fetchWowStatic,
} from "@/features/views/api/viewQueries.ts";

interface ViewEditMeta {
  pendingCharacters: RaiderioProfile[];
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_EDIT_POLLS = 5;
const characterKey = (c: { name: string }) => c.name.toLowerCase();

export function useViewDetail(
  viewId: string | undefined,
  owner: string | null,
  initialEntitiesCount: number,
) {
  const queryClient = useQueryClient();
  const username = useAppSelector(selectUsername);

  const [expectedCount, setExpectedCount] = useState(initialEntitiesCount);
  const editPollCountRef = useRef(0);
  const lastSeenDataUpdatedAt = useRef(0);

  const isViewIdValid = !!viewId && UUID_REGEX.test(viewId);
  const safeViewId = viewId ?? "";

  const { data: rawViewData, isLoading, dataUpdatedAt } = useQuery({
    queryKey: viewKeys.data(safeViewId),
    queryFn: () => fetchViewData(safeViewId),
    enabled: isViewIdValid,
    refetchInterval: (query) => {
      const hasPendingScore = query.state.data?.data.some((c) => c.score === -1);
      const hasEditMeta = !!queryClient.getQueryData<ViewEditMeta>(viewKeys.editMeta(safeViewId));
      const isSyncingInitial =
        !hasEditMeta && expectedCount > 0 && (query.state.data?.data.length ?? 0) === 0;
      return hasPendingScore || hasEditMeta || isSyncingInitial ? 3000 : false;
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

  const { data: editMeta } = useQuery({
    queryKey: viewKeys.editMeta(safeViewId),
    queryFn: () => null as ViewEditMeta | null,
    enabled: false,
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
    initialData: null,
  });

  const { data: syncError } = useQuery({
    queryKey: viewKeys.syncError(safeViewId),
    queryFn: () => null as RaiderioProfile[] | null,
    enabled: false,
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
    initialData: null,
  });

  // Pure: compute which profiles to display
  const profiles = useMemo(() => {
    const apiData = rawViewData?.data ?? [];
    if (!editMeta) return apiData;

    const { pendingCharacters } = editMeta;
    const apiByKey = new Map(apiData.map((c) => [characterKey(c), c]));
    const pendingKeys = new Set(pendingCharacters.map(characterKey));

    const backendCaughtUp =
      apiData.every((c) => pendingKeys.has(characterKey(c))) &&
      pendingCharacters.every((c) => apiByKey.has(characterKey(c)));

    if (backendCaughtUp) return apiData;

    return pendingCharacters.map((c) => apiByKey.get(characterKey(c)) ?? c);
  }, [rawViewData, editMeta]);

  // Side effects: clear editMeta on sync completion or poll timeout
  useEffect(() => {
    if (!editMeta) return;

    const apiData = rawViewData?.data ?? [];
    const { pendingCharacters } = editMeta;
    const apiByKey = new Map(apiData.map((c) => [characterKey(c), c]));
    const pendingKeys = new Set(pendingCharacters.map(characterKey));

    const backendCaughtUp =
      apiData.every((c) => pendingKeys.has(characterKey(c))) &&
      pendingCharacters.every((c) => apiByKey.has(characterKey(c)));

    if (backendCaughtUp) {
      editPollCountRef.current = 0;
      queryClient.setQueryData(viewKeys.editMeta(safeViewId), null);
      return;
    }

    if (dataUpdatedAt > lastSeenDataUpdatedAt.current) {
      lastSeenDataUpdatedAt.current = dataUpdatedAt;
      editPollCountRef.current += 1;
      if (editPollCountRef.current >= MAX_EDIT_POLLS) {
        editPollCountRef.current = 0;
        const failed = pendingCharacters.filter((c) => !apiByKey.has(characterKey(c)));
        if (failed.length > 0) {
          queryClient.setQueryData(viewKeys.syncError(safeViewId), failed);
        }
        queryClient.setQueryData(viewKeys.editMeta(safeViewId), null);
      }
    }
  }, [rawViewData, editMeta, dataUpdatedAt, queryClient, safeViewId]);

  const saveMutation = useMutation({
    mutationFn: (characters: RaiderioProfile[]) => {
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
      return userRequestVoid("PUT", `/views/${safeViewId}`, request);
    },

    onMutate: async (characters) => {
      editPollCountRef.current = 0;
      lastSeenDataUpdatedAt.current = dataUpdatedAt;
      queryClient.setQueryData(viewKeys.syncError(safeViewId), null);
      setExpectedCount(characters.length);
      await queryClient.cancelQueries({ queryKey: viewKeys.data(safeViewId) });
      await queryClient.cancelQueries({ queryKey: viewKeys.ownList() });

      queryClient.setQueryData<ViewEditMeta>(viewKeys.editMeta(safeViewId), {
        pendingCharacters: characters,
      });

      queryClient.setQueryData<View[]>(viewKeys.ownList(), (old) =>
        old?.map((v) =>
          v.id === safeViewId
            ? { ...v, simpleView: { ...v.simpleView, entitiesIds: characters.map((_, i) => i) } }
            : v,
        ) ?? [],
      );
    },

    onError: () => {
      queryClient.setQueryData(viewKeys.editMeta(safeViewId), null);
      queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
    },
  });

  const saveCharacters = async (characters: RaiderioProfile[]) => {
    if (!haveSameCharacters(characters, profiles)) {
      await saveMutation.mutateAsync(characters);
    }
  };

  const clearSyncError = () => {
    queryClient.setQueryData(viewKeys.syncError(safeViewId), null);
  };

  return {
    profiles,
    cachedProfiles: cachedData?.data ?? [],
    viewName: rawViewData?.viewName ?? "",
    season: season ?? null,
    initialized: !isLoading,
    editMeta,
    syncError,
    canEdit: username !== null && username === owner,
    isViewIdValid,
    expectedCount,
    saveCharacters,
    clearSyncError,
  };
}
