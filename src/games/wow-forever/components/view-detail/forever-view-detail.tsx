import { useEffect, useState } from 'react';
import { Edit } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSyncView } from '@/features/views/hooks/useSyncView.ts';
import { useView } from '@/features/views/hooks/useView.ts';
import { useSaveEntities } from '@/features/views/hooks/useSaveEntities.ts';
import { ViewDetailHeader } from '@/features/views/components/view-detail/view-detail-header.tsx';
import { SyncErrorDialog } from '@/features/views/components/shared/sync-error-dialog.tsx';
import { ForeverCharacter } from '@/games/wow-forever/api/forever-types.ts';
import { toEntityRequest } from '@/games/wow-forever/api/forever-entity-api.ts';
import { useForeverViewData } from '@/games/wow-forever/hooks/useForeverViewData.ts';
import {
  CharacterRef,
  characterKey,
  formatCharacterName,
} from '@/games/wow-forever/model/character.ts';
import { regionLabel } from '@/games/wow-forever/constants/regions.ts';
import { buildLadder } from '@/games/wow-forever/model/ladder.ts';
import { ForeverLadder } from './forever-ladder.tsx';
import { EditForeverView } from './actions/edit-forever-view.tsx';
import '@/features/views/components/shared/empty-state.css';

const toRef = ({ name, surname, region }: ForeverCharacter): CharacterRef => ({
  name,
  surname,
  region,
});

export function ForeverViewDetail() {
  const { viewId } = useParams();
  const navigate = useNavigate();
  const { isValid, isLoading, viewName, characters, cachedCharacters } = useForeverViewData(viewId);
  const sync = useSyncView(viewId);
  const { isOwner } = useView(viewId);
  const { isSaving, pending, failed, save, clearFailed } = useSaveEntities(
    viewId,
    viewName,
    characters,
    {
      game: 'WOW_FOREVER',
      noun: 'characters',
      fromData: toRef,
      key: characterKey,
      toRequest: toEntityRequest,
    },
  );
  const pendingKeys = new Set(pending.map((p) => characterKey(p.entity)));
  const ladderCharacters = characters.filter((c) => !pendingKeys.has(characterKey(c)));
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    if (!isValid) navigate('/wow-forever');
  }, [isValid, navigate]);

  if (isLoading) return null;

  return (
    <div className="page">
      <div className="page-inner page-inner--wide">
        <ViewDetailHeader
          title={viewName}
          sync={sync}
          isSyncBlocked={isSaving || isEditOpen}
          actions={
            isOwner && (
              <button
                className="header-edit-button"
                onClick={() => setIsEditOpen(true)}
                disabled={isSaving || sync.isRunning}
                title={isSaving || sync.isRunning ? 'Wait for sync to complete' : undefined}
              >
                <Edit className="header-icon" />
                <span className="header-button-text">Edit</span>
              </button>
            )
          }
        />

        {characters.length === 0 && pending.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-title">No characters in this ladder</h3>
            {isOwner && (
              <button className="empty-add-btn" onClick={() => setIsEditOpen(true)}>
                + Add
              </button>
            )}
          </div>
        ) : (
          <ForeverLadder
            entries={buildLadder(ladderCharacters, cachedCharacters)}
            pending={pending}
          />
        )}
      </div>

      {isEditOpen && (
        <EditForeverView
          characters={characters.map(toRef)}
          onClose={() => setIsEditOpen(false)}
          onSave={save}
        />
      )}

      <SyncErrorDialog
        title="Some characters couldn't be synced"
        description="The following characters were not found or couldn't be processed. Please check that the name, surname and region are correct."
        items={failed.map((character) => ({
          key: characterKey(character),
          name: formatCharacterName(character),
          meta: regionLabel(character.region),
        }))}
        onClose={clearFailed}
      />
    </div>
  );
}
