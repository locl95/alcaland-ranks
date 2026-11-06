import { useEffect, useState } from 'react';
import { Edit } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSyncView } from '@/features/views/hooks/useSyncView.ts';
import { useView } from '@/features/views/hooks/useView.ts';
import { ViewDetailHeader } from '@/features/views/components/view-detail/view-detail-header.tsx';
import { Queue } from '@/games/lol/api/lol-types.ts';
import { useLolViewData } from '@/games/lol/hooks/useLolViewData.ts';
import { useSaveLolView } from '@/games/lol/hooks/useSaveLolView.ts';
import { riotIdKey } from '@/games/lol/model/riot-id.ts';
import { LolLadder } from './lol-ladder.tsx';
import { EditLolView } from './actions/edit-lol-view.tsx';
import '@/features/views/components/shared/empty-state.css';

export function LolViewDetail() {
  const { viewId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queue: Queue = searchParams.get('queue') === 'flex' ? 'flex' : 'solo';

  const { isValid, isLoading, viewName, players, cachedPlayers } = useLolViewData(viewId);
  const sync = useSyncView(viewId);
  const { isOwner } = useView(viewId);
  const riotIds = players.map((p) => ({ name: p.summonerName, tag: p.summonerTag }));
  const { isSaving, pending, save } = useSaveLolView(viewId, viewName, riotIds);
  const pendingKeys = new Set(pending.map(riotIdKey));
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
    </div>
  );
}
