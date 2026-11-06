import { EntityStatus } from '@/features/views/hooks/useSaveEntities.ts';
import { PendingStatus } from '@/features/views/components/shared/pending-status.tsx';
import { RiotId } from '@/games/lol/model/riot-id.ts';

interface LolPendingRowProps {
  riotId: RiotId;
  status: EntityStatus;
}

export function LolPendingRow({ riotId, status }: Readonly<LolPendingRowProps>) {
  return (
    <tr className="lol-row lol-row--pending">
      <td className="lol-cell-standing num">—</td>
      <td>
        <div className="lol-player">
          <span className="lol-player-icon lol-player-icon--empty" aria-hidden={true} />
          <span className="lol-player-name">{riotId.name}</span>
          <span className="lol-player-tag">#{riotId.tag}</span>
        </div>
      </td>
      <td colSpan={7} className="lol-cell-pending">
        <PendingStatus status={status} />
      </td>
    </tr>
  );
}
