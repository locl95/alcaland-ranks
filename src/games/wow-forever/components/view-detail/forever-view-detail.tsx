import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSyncView } from '@/features/views/hooks/useSyncView.ts';
import { ViewDetailHeader } from '@/features/views/components/view-detail/view-detail-header.tsx';
import { useForeverViewData } from '@/games/wow-forever/hooks/useForeverViewData.ts';
import { buildLadder } from '@/games/wow-forever/model/ladder.ts';
import { ForeverLadder } from './forever-ladder.tsx';
import '@/features/views/components/shared/empty-state.css';

export function ForeverViewDetail() {
  const { viewId } = useParams();
  const navigate = useNavigate();
  const { isValid, isLoading, viewName, characters, cachedCharacters } = useForeverViewData(viewId);
  const sync = useSyncView(viewId);

  useEffect(() => {
    if (!isValid) navigate('/wow-forever');
  }, [isValid, navigate]);

  if (isLoading) return null;

  return (
    <div className="page">
      <div className="page-inner page-inner--wide">
        <ViewDetailHeader title={viewName} sync={sync} isSyncBlocked={false} />

        {characters.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-title">No characters in this ladder</h3>
          </div>
        ) : (
          <ForeverLadder entries={buildLadder(characters, cachedCharacters)} />
        )}
      </div>
    </div>
  );
}
