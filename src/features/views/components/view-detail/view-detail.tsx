import { useEffect, useState } from "react";
import { ArrowLeft, Edit, Trophy, Loader2 } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useViewDetail } from "@/features/views/hooks/useViewDetail.ts";
import { CharacterLadder } from "./character-ladder/character-ladder.tsx";
import { DungeonGrid } from "./dungeon-grid/dungeon-grid.tsx";
import { EditView } from "./actions/edit-view.tsx";
import { SyncErrorDialog } from "./actions/sync-error-dialog.tsx";
import "./view-detail.css";

export function ViewDetail() {
  const { viewId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as {
    owner?: string;
    entitiesCount?: number;
  } | null;
  const owner = locationState?.owner ?? null;
  const entitiesCount = locationState?.entitiesCount ?? 0;

  const [isEditOpen, setIsEditOpen] = useState(false);

  const {
    profiles,
    cachedProfiles,
    viewName,
    season,
    initialized,
    editMeta,
    syncError,
    canEdit,
    isViewIdValid,
    expectedCount,
    saveCharacters,
    clearSyncError,
  } = useViewDetail(viewId, owner, entitiesCount);

  useEffect(() => {
    if (viewId && !isViewIdValid) {
      navigate("/");
    }
  }, [viewId, isViewIdValid, navigate]);

  const handleSavedCharacters = async (characters: typeof profiles) => {
    await saveCharacters(characters);
    setIsEditOpen(false);
  };

  if (!initialized) return null;

  return (
    <div className="view-detail-container">
      <div className="view-detail-content">
        <div className="view-detail-header">
          <button onClick={() => navigate("/")} className="header-back-button">
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

        {profiles.length === 0 && expectedCount > 0 ? (
          <div className="syncing-state">
            <Loader2 className="syncing-icon" />
            <h3 className="syncing-title">Syncing characters…</h3>
            <p className="syncing-text">
              Your characters are being prepared. This usually takes a few
              seconds.
            </p>
          </div>
        ) : profiles.length === 0 ? (
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
              season={season}
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

      <SyncErrorDialog
        failedCharacters={syncError ?? []}
        onClose={clearSyncError}
      />
    </div>
  );
}
