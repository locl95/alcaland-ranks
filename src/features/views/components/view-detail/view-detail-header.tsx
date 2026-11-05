import { ReactNode } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/shared/game/game.ts';
import { SyncViewResult } from '@/features/views/hooks/useSyncView.ts';
import './view-detail-header.css';

interface ViewDetailHeaderProps {
  title: string;
  sync: SyncViewResult;
  isSyncBlocked?: boolean;
  actions?: ReactNode;
}

export function ViewDetailHeader({
  title,
  sync,
  isSyncBlocked = false,
  actions,
}: Readonly<ViewDetailHeaderProps>) {
  const navigate = useNavigate();
  const game = useGame();
  const { isRunning, isDisabled, countdownLabel, statusMessage, lastSyncedAt, triggerSync } = sync;
  const syncLabel = isRunning ? 'Syncing...' : countdownLabel;

  return (
    <div className="view-detail-header">
      <button onClick={() => navigate(`/${game}`)} className="header-back-button">
        <ArrowLeft className="header-icon" />
      </button>
      <h1 className="header-view-title">{title}</h1>
      <div className="header-actions">
        <div className="header-actions-buttons">
          <button
            className="header-sync-button"
            onClick={triggerSync}
            disabled={isDisabled || isSyncBlocked}
            title={statusMessage ?? (countdownLabel ? `Next sync in ${countdownLabel}` : undefined)}
            aria-label={syncLabel ? undefined : 'Sync'}
          >
            <RefreshCw className={`header-icon${isRunning ? ' spin' : ''}`} />
            {syncLabel && <span className="header-button-text">{syncLabel}</span>}
          </button>
          {actions}
        </div>
        {lastSyncedAt && (
          <p className="header-last-synced">
            Last synced {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}
          </p>
        )}
      </div>
    </div>
  );
}
