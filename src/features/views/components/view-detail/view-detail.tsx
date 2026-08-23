import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Edit, RefreshCw } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useViewDetail } from '@/features/views/hooks/useViewDetail.ts';
import { useSyncView } from '@/features/views/hooks/useSyncView.ts';
import { CharacterLadder } from './character-ladder/character-ladder.tsx';
import { DungeonGrid } from './dungeon-grid/dungeon-grid.tsx';
import { EditView } from './actions/edit-view.tsx';
import { SyncErrorDialog } from './actions/sync-error-dialog.tsx';
import './view-detail.css';

export function ViewDetail() {
  const { viewId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as { owner?: string } | null;
  const owner = locationState?.owner ?? null;

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
  } = useViewDetail(viewId, owner);

  const {
    isRunning,
    isDisabled: isSyncDisabled,
    countdownLabel,
    statusMessage,
    lastSyncedAt,
    triggerSync,
  } = useSyncView(viewId);

  useEffect(() => {
    if (viewId && !isViewIdValid) {
      navigate('/');
    }
  }, [viewId, isViewIdValid, navigate]);

  const handleSavedCharacters = (characters: typeof profiles) => {
    setIsEditOpen(false);
    saveCharacters(characters);
  };

  if (!initialized) return null;

  return (
    <div className="page">
      <div className="page-inner page-inner--wide">
        <div className="view-detail-header">
          <button onClick={() => navigate('/')} className="header-back-button">
            <ArrowLeft className="header-icon" />
          </button>
          <h1 className="header-view-title">{viewName}</h1>
          <div className="header-actions">
            <div className="header-actions-buttons">
              <button
                className="header-sync-button"
                onClick={triggerSync}
                disabled={isSyncDisabled || isSyncing || isEditOpen}
                title={
                  statusMessage ?? (countdownLabel ? `Next sync in ${countdownLabel}` : undefined)
                }
              >
                <RefreshCw className={`header-icon${isRunning ? ' spin' : ''}`} />
                <span className="header-button-text">
                  {isRunning ? 'Syncing...' : (countdownLabel ?? 'Sync')}
                </span>
              </button>
              {canEdit && (
                <button
                  className="header-edit-button"
                  onClick={() => setIsEditOpen(!isEditOpen)}
                  disabled={isSyncing || isRunning}
                  title={isSyncing || isRunning ? 'Wait for sync to complete' : undefined}
                >
                  <Edit className="header-icon" />
                  <span className="header-button-text">Edit</span>
                </button>
              )}
            </div>
            {lastSyncedAt && (
              <p className="header-last-synced">
                Last synced {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>

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
              <DungeonGrid
                raiderioProfiles={profiles}
                raiderioCachedProfiles={cachedProfiles}
                season={season}
              />
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
