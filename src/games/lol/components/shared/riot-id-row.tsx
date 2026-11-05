import { Plus, X } from 'lucide-react';
import {
  CheckStatus,
  VerificationBadge,
} from '@/features/views/components/shared/verification-badge.tsx';
import { parseRiotId } from '@/games/lol/model/riot-id.ts';
import './riot-id-row.css';

interface RiotIdRowProps {
  riotId: string;
  status: 'draft' | CheckStatus;
  canRemove: boolean;
  onChange: (riotId: string) => void;
  onVerify: () => void;
  onRemove: () => void;
}

export function RiotIdRow({
  riotId,
  status,
  canRemove,
  onChange,
  onVerify,
  onRemove,
}: Readonly<RiotIdRowProps>) {
  return (
    <div className="player-row">
      <input
        className="form-input"
        placeholder="Riot ID, e.g. Faker#KR1"
        aria-label="Riot ID"
        value={riotId}
        onChange={(e) => onChange(e.target.value)}
      />

      {status === 'draft' ? (
        <button
          type="button"
          className="btn-icon btn-icon-primary"
          onClick={onVerify}
          disabled={!parseRiotId(riotId)}
          title="Add"
        >
          <Plus size={16} />
        </button>
      ) : (
        <VerificationBadge status={status} noun="Player" />
      )}

      {canRemove && (
        <button
          type="button"
          className="btn-icon btn-icon-outline"
          onClick={onRemove}
          title="Remove"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
