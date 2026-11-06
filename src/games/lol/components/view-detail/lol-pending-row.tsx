import { Loader2 } from 'lucide-react';
import { PendingPlayer } from '@/games/lol/hooks/useSaveLolView.ts';

interface LolPendingRowProps {
  player: PendingPlayer;
}

export function LolPendingRow({ player }: Readonly<LolPendingRowProps>) {
  return (
    <tr className="lol-row lol-row--pending">
      <td className="lol-cell-standing num">—</td>
      <td>
        <div className="lol-player">
          <span className="lol-player-icon lol-player-icon--empty" aria-hidden={true} />
          <span className="lol-player-name">{player.name}</span>
          <span className="lol-player-tag">#{player.tag}</span>
        </div>
      </td>
      <td colSpan={7}>
        <span className="lol-pending">
          {player.status === 'syncing' ? 'Syncing…' : 'Deleting…'}
          <Loader2 className="lol-pending-spinner" aria-hidden={true} />
        </span>
      </td>
    </tr>
  );
}
