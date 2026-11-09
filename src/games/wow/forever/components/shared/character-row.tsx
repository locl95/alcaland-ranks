import { Plus, X } from 'lucide-react';
import {
  CheckStatus,
  VerificationBadge,
} from '@/features/views/components/shared/verification-badge.tsx';
import { CharacterRef, isCompleteCharacter } from '@/games/wow/forever/model/character.ts';
import { REGIONS } from '@/games/wow/forever/constants/regions.ts';
import './character-row.css';

interface CharacterRowProps {
  character: CharacterRef;
  status: 'draft' | CheckStatus;
  canRemove: boolean;
  onChange: (changes: Partial<CharacterRef>) => void;
  onVerify: () => void;
  onRemove: () => void;
}

export function CharacterRow({
  character,
  status,
  canRemove,
  onChange,
  onVerify,
  onRemove,
}: Readonly<CharacterRowProps>) {
  return (
    <div className="forever-character-row">
      <input
        className="form-input"
        placeholder="Name"
        aria-label="Name"
        value={character.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <input
        className="form-input"
        placeholder="Surname"
        aria-label="Surname"
        value={character.surname}
        onChange={(e) => onChange({ surname: e.target.value })}
      />
      <select
        className="form-select form-select-region"
        aria-label="Region"
        value={character.region}
        onChange={(e) => onChange({ region: e.target.value })}
      >
        {REGIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {status === 'draft' ? (
        <button
          type="button"
          className="btn-icon btn-icon-primary"
          onClick={onVerify}
          disabled={!isCompleteCharacter(character)}
          title="Add"
        >
          <Plus size={16} />
        </button>
      ) : (
        <VerificationBadge status={status} noun="Character" />
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
