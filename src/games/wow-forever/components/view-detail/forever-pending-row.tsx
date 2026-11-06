import { EntityStatus } from '@/features/views/hooks/useSaveEntities.ts';
import { PendingStatus } from '@/features/views/components/shared/pending-status.tsx';
import { CharacterRef, formatCharacterName } from '@/games/wow-forever/model/character.ts';

interface ForeverPendingRowProps {
  character: CharacterRef;
  status: EntityStatus;
}

export function ForeverPendingRow({ character, status }: Readonly<ForeverPendingRowProps>) {
  return (
    <li className="forever-row forever-row--pending">
      <span className="forever-row-position num">—</span>
      <span className="forever-portrait forever-portrait--empty" aria-hidden={true} />
      <div className="forever-row-info">
        <p className="forever-row-name">{formatCharacterName(character)}</p>
      </div>
      <PendingStatus status={status} />
    </li>
  );
}
