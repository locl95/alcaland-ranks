import { Loader2 } from 'lucide-react';
import { EntityStatus } from '@/features/views/hooks/useSaveEntities.ts';
import './pending-status.css';

interface PendingStatusProps {
  status: EntityStatus;
}

export function PendingStatus({ status }: Readonly<PendingStatusProps>) {
  return (
    <span className="pending-status">
      {status === 'syncing' ? 'Syncing…' : 'Deleting…'}
      <Loader2 className="pending-status-spinner" aria-hidden={true} />
    </span>
  );
}
