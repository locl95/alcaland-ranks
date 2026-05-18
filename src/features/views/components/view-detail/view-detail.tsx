import { useEffect, useState } from 'react';
import { ArrowLeft, Edit, Trophy } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useViewDetail } from '@/features/views/hooks/useViewDetail.ts';
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
    <div className="view-detail-container">
      <div className="view-detail-content">
        <div className="view-detail-header">
          <button onClick={() => navigate('/')} className="header-back-button">
            <ArrowLeft className="header-icon" />
          </button>
          <h1 className="header-view-title">{viewName}</h1>
          {canEdit && (
            <button
              className="header-edit-button"
              onClick={() => setIsEditOpen(!isEditOpen)}
              disabled={isSyncing}
              title={isSyncing ? 'Wait for sync to complete' : undefined}
            >
              <Edit className="header-icon" />
              <span className="header-button-text">Edit</span>
            </button>
          )}
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

      <EditView
        isOpen={isEditOpen}
        characters={profiles}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSavedCharacters}
      />

      <SyncErrorDialog failedCharacters={syncError ?? []} onClose={clearSyncError} />
    </div>
  );
}
