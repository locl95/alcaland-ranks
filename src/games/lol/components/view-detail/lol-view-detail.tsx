import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSyncView } from '@/features/views/hooks/useSyncView.ts';
import { ViewDetailHeader } from '@/features/views/components/view-detail/view-detail-header.tsx';
import { Queue } from '@/games/lol/api/lol-types.ts';
import { useLolViewData } from '@/games/lol/hooks/useLolViewData.ts';
import { LolLadder } from './lol-ladder.tsx';
import '@/features/views/components/shared/empty-state.css';

export function LolViewDetail() {
  const { viewId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queue: Queue = searchParams.get('queue') === 'flex' ? 'flex' : 'solo';

  const { isValid, isLoading, viewName, players, cachedPlayers } = useLolViewData(viewId);
  const sync = useSyncView(viewId);

  useEffect(() => {
    if (!isValid) navigate('/lol');
  }, [isValid, navigate]);

  if (isLoading) return null;

  return (
    <div className="page">
      <div className="page-inner page-inner--wide">
        <ViewDetailHeader title={viewName} sync={sync} />

        {players.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-title">No players in this ladder</h3>
          </div>
        ) : (
          <LolLadder
            players={players}
            cachedPlayers={cachedPlayers}
            queue={queue}
            onQueueChange={(next) => setSearchParams({ queue: next }, { replace: true })}
          />
        )}
      </div>
    </div>
  );
}
