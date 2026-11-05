import { useEffect, useState } from 'react';
import { Edit } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useViewDetail } from '@/features/views/hooks/useViewDetail.ts';
import { useSyncView } from '@/features/views/hooks/useSyncView.ts';
import { useGame } from '@/shared/game/game.ts';
import { CharacterLadder } from './character-ladder/character-ladder.tsx';
import { DungeonGrid } from './dungeon-grid/dungeon-grid.tsx';
import { ViewDetailHeader } from './view-detail-header.tsx';
import { EditView } from './actions/edit-view.tsx';
import { SyncErrorDialog } from './actions/sync-error-dialog.tsx';
import './view-detail.css';

export function ViewDetail() {
  const { viewId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const game = useGame();

  const locationState = location.state as { owner?: string; isGuild?: boolean } | null;
  const owner = locationState?.owner ?? null;
  const isGuild = locationState?.isGuild ?? false;

  const [isEditOpen, setIsEditOpen] = useState(false);

  const {
    profiles,
    cachedProfiles,
    viewName,
    season,
    initialized,
    isSyncing,
    syncError,
    canEdit,
    isViewIdValid,
    saveCharacters,
    clearSyncError,
  } = useViewDetail(viewId, owner, isGuild);

  const sync = useSyncView(viewId);

  useEffect(() => {
    if (viewId && !isViewIdValid) {
      navigate(`/${game}`);
    }
  }, [viewId, isViewIdValid, navigate, game]);

  const handleSavedCharacters = async (characters: typeof profiles) => {
    const error = await saveCharacters(characters);
    if (error === null) setIsEditOpen(false);
    return error;
  };

  if (!initialized) return null;

  return (
    <div className="page">
      <div className="page-inner page-inner--wide">
        <ViewDetailHeader
          title={viewName}
          sync={sync}
          isSyncBlocked={isSyncing || isEditOpen}
          actions={
            canEdit && (
              <button
                className="header-edit-button"
                onClick={() => setIsEditOpen(!isEditOpen)}
                disabled={isSyncing || sync.isRunning}
                title={isSyncing || sync.isRunning ? 'Wait for sync to complete' : undefined}
              >
                <Edit className="header-icon" />
                <span className="header-button-text">Edit</span>
              </button>
            )
          }
        />

        {profiles.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-title">No characters in this ladder</h3>
            <p className="empty-text">Add characters to start tracking their Mythic+ progress</p>
            {canEdit && (
              <button className="empty-add-btn" onClick={() => setIsEditOpen(true)}>
                + Add
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
              <DungeonGrid profiles={profiles} cachedProfiles={cachedProfiles} season={season} />
            )}
          </>
        )}
      </div>

      {isEditOpen && (
        <EditView
          characters={profiles}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSavedCharacters}
        />
      )}

      <SyncErrorDialog failedCharacters={syncError ?? []} onClose={clearSyncError} />
    </div>
  );
}
