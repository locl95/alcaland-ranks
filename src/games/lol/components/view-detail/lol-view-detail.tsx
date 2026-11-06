import { useEffect, useState } from 'react';
import { Edit } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSyncView } from '@/features/views/hooks/useSyncView.ts';
import { useView } from '@/features/views/hooks/useView.ts';
import { ViewDetailHeader } from '@/features/views/components/view-detail/view-detail-header.tsx';
import { LolPlayer, Queue } from '@/games/lol/api/lol-types.ts';
import { useLadderData } from '@/features/views/hooks/useLadderData.ts';
import { useSaveEntities } from '@/features/views/hooks/useSaveEntities.ts';
import { SyncErrorDialog } from '@/features/views/components/shared/sync-error-dialog.tsx';
import { riotIdKey } from '@/games/lol/model/riot-id.ts';
import { LolLadder } from './lol-ladder.tsx';
import { EditLolView } from './actions/edit-lol-view.tsx';
import '@/features/views/components/shared/empty-state.css';

const toRiotId = (p: LolPlayer) => ({ name: p.summonerName, tag: p.summonerTag });

export function LolViewDetail() {
  const { viewId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queue: Queue = searchParams.get('queue') === 'flex' ? 'flex' : 'solo';

  const {
    isValid,
    isLoading,
    viewName,
    rows: players,
    cachedRows: cachedPlayers,
  } = useLadderData<LolPlayer>(viewId);
  const sync = useSyncView(viewId);
  const { isOwner } = useView(viewId);
  const riotIds = players.map(toRiotId);
  const { isSaving, pending, failed, save, clearFailed } = useSaveEntities(
    viewId,
    viewName,
    players,
    {
      game: 'LOL',
      noun: 'players',
      fromData: toRiotId,
      key: riotIdKey,
      toRequest: (riotId) => ({ type: 'lol', ...riotId }),
    },
  );
  const pendingKeys = new Set(pending.map((p) => riotIdKey(p.entity)));
  const ladderPlayers = players.filter((_, i) => !pendingKeys.has(riotIdKey(riotIds[i])));
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    if (!isValid) navigate('/lol');
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

        {players.length === 0 && pending.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-title">No players in this ladder</h3>
            {isOwner && (
              <button className="empty-add-btn" onClick={() => setIsEditOpen(true)}>
                + Add
              </button>
            )}
          </div>
        ) : (
          <LolLadder
            players={ladderPlayers}
            cachedPlayers={cachedPlayers}
            pending={pending}
            queue={queue}
            onQueueChange={(next) => setSearchParams({ queue: next }, { replace: true })}
          />
        )}
      </div>

      {isEditOpen && (
        <EditLolView players={riotIds} onClose={() => setIsEditOpen(false)} onSave={save} />
      )}

      <SyncErrorDialog
        title="Some players couldn't be synced"
        description="The following players were not found or couldn't be processed. Please check that the Riot ID is correct."
        items={failed.map((riotId) => ({
          key: riotIdKey(riotId),
          name: `${riotId.name}#${riotId.tag}`,
        }))}
        onClose={clearFailed}
      />
    </div>
  );
}
