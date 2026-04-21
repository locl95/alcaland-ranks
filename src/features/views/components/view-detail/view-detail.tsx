import { ArrowLeft, Edit, Trophy, Loader2 } from "lucide-react";
import { useAppSelector } from "@/app/hooks.ts";
import "./view-detail.css";
import { useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RaiderioProfile } from "@/features/views/api/raiderio.ts";
import { View } from "@/features/views/model/view.ts";
import { selectUsername } from "@/app/authSlice.ts";
import { userRequestVoid } from "@/shared/api/httpClient.ts";
import { ViewRequest } from "@/features/views/api/view-types.ts";
import { CharacterLadder } from "./character-ladder/character-ladder.tsx";
import { DungeonGrid } from "./dungeon-grid/dungeon-grid.tsx";
import { EditView } from "./actions/edit-view.tsx";
import {
  viewKeys,
  fetchViewData,
  fetchCachedViewData,
  fetchWowStatic,
} from "@/features/views/api/viewQueries.ts";

interface ViewEditMeta {
  pendingCharacters: RaiderioProfile[];
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ViewDetail({ onBack }: Readonly<{ onBack: () => void }>) {
  const { viewId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const username = useAppSelector(selectUsername);

  const locationState = location.state as { owner?: string; entitiesCount?: number } | null;
  const owner = locationState?.owner ?? null;
  const entitiesCount = locationState?.entitiesCount ?? 0;
  const canEdit = username !== null && username === owner;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [expectedCount, setExpectedCount] = useState(entitiesCount);

  const isViewIdValid = !!viewId && UUID_REGEX.test(viewId);
  const safeViewId = viewId ?? "";

  if (viewId && !UUID_REGEX.test(viewId)) {
    navigate("/");
  }

  const { data: rawViewData, isLoading } = useQuery({
    queryKey: viewKeys.data(safeViewId),
    queryFn: () => fetchViewData(safeViewId),
    enabled: isViewIdValid,
    refetchInterval: (query) => {
      const hasPendingScore = query.state.data?.data.some((c) => c.score === -1);
      const hasEditMeta = !!queryClient.getQueryData<ViewEditMeta>(
        viewKeys.editMeta(safeViewId),
      );
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

  const profiles = useMemo(() => {
    const apiData = rawViewData?.data ?? [];
    if (!editMeta) return apiData;

    const { pendingCharacters } = editMeta;

    const key = (c: RaiderioProfile) => c.name.toLowerCase();

    const apiByKey = new Map(apiData.map((c) => [key(c), c]));
    const pendingKeys = new Set(pendingCharacters.map(key));

    const backendCaughtUp =
      apiData.every((c) => pendingKeys.has(key(c))) &&
      pendingCharacters.every((c) => apiByKey.has(key(c)));

    if (backendCaughtUp) {
      queryClient.setQueryData(viewKeys.editMeta(safeViewId), null);
      return apiData;
    }

    return pendingCharacters.map((c) => apiByKey.get(key(c)) ?? c);
  }, [rawViewData, editMeta, viewId, queryClient]);

  const cachedProfiles = cachedData?.data ?? [];
  const viewName = rawViewData?.viewName ?? "";
  const initialized = !isLoading;

  const haveSameCharacters = (a: RaiderioProfile[], b: RaiderioProfile[]): boolean => {
    if (a.length !== b.length) return false;
    const idsA = new Set(a.map((c) => c.id));
    return b.every((c) => idsA.has(c.id));
  };

  const saveMutation = useMutation({
    mutationFn: (characters: RaiderioProfile[]) => {
      const request: ViewRequest = {
        name: viewName,
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
      return userRequestVoid("PUT", `/views/${viewId}`, request);
    },

    onMutate: async (characters) => {
      setExpectedCount(characters.length);
      await queryClient.cancelQueries({ queryKey: viewKeys.data(safeViewId) });
      await queryClient.cancelQueries({ queryKey: viewKeys.list() });

      queryClient.setQueryData<ViewEditMeta>(viewKeys.editMeta(safeViewId), {
        pendingCharacters: characters,
      });

      queryClient.setQueryData<View[]>(viewKeys.list(), (old) =>
        old?.map((v) =>
          v.id === viewId
            ? {
                ...v,
                simpleView: {
                  ...v.simpleView,
                  entitiesIds: characters.map((_, i) => i),
                },
              }
            : v,
        ) ?? [],
      );
    },

    onError: () => {
      queryClient.setQueryData(viewKeys.editMeta(safeViewId), null);
      queryClient.invalidateQueries({ queryKey: viewKeys.list() });
    },
  });

  const handleSavedCharacters = async (characters: RaiderioProfile[]) => {
    if (!haveSameCharacters(characters, profiles)) {
      await saveMutation.mutateAsync(characters);
    }
    setIsEditOpen(false);
  };

  if (!initialized) return null;

  return (
    <div className="view-detail-container">
      <div className="view-detail-content">
        <div className="view-detail-header">
          <button onClick={onBack} className="header-back-button">
            <ArrowLeft className="header-icon" />
          </button>
          <h1 className="header-view-title">{viewName}</h1>
          {canEdit && (
            <button
              className="header-edit-button"
              onClick={() => setIsEditOpen(!isEditOpen)}
              disabled={!!editMeta}
              title={editMeta ? "Wait for sync to complete" : undefined}
            >
              <Edit className="header-icon" />
              <span className="header-button-text">Edit</span>
            </button>
          )}
        </div>

        {!isLoading && profiles.length === 0 && expectedCount > 0 ? (
          <div className="syncing-state">
            <Loader2 className="syncing-icon" />
            <h3 className="syncing-title">Syncing characters…</h3>
            <p className="syncing-text">
              Your characters are being prepared. This usually takes a few seconds.
            </p>
          </div>
        ) : !isLoading && profiles.length === 0 ? (
          <div className="empty-state">
            <Trophy className="empty-icon" />
            <h3 className="empty-title">No characters in this view</h3>
            <p className="empty-text">
              Add characters to start tracking their Mythic+ progress
            </p>
            {canEdit && (
              <button
                className="empty-add-btn"
                onClick={() => setIsEditOpen(true)}
              >
                Add Your First Character
              </button>
            )}
          </div>
        ) : (
          <>
            <CharacterLadder
              characters={profiles}
              cachedCharacters={cachedProfiles}
              season={season ?? null}
            />

            {season && (
              <DungeonGrid
                raiderioProfiles={profiles}
                raiderioCachedProfiles={cachedProfiles}
                season={season}
              />
            )}
          </>
        )}
      </div>

      <EditView
        isOpen={isEditOpen}
        characters={profiles}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSavedCharacters}
      />

    </div>
  );
}
