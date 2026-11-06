import { PendingEntity } from '@/features/views/hooks/useSaveEntities.ts';
import { useEntityPage } from '@/features/views/hooks/useEntityPage.ts';
import { Pager } from '@/features/views/components/shared/pager.tsx';
import { CharacterRef, characterKey } from '@/games/wow-forever/model/character.ts';
import { LadderEntry } from '@/games/wow-forever/model/ladder.ts';
import { ForeverLadderRow } from './forever-ladder-row.tsx';
import { ForeverPendingRow } from './forever-pending-row.tsx';
import './forever-ladder.css';

interface ForeverLadderProps {
  entries: LadderEntry[];
  pending: PendingEntity<CharacterRef>[];
}

export function ForeverLadder({ entries, pending }: Readonly<ForeverLadderProps>) {
  const { pageItems, startIndex, pagination } = useEntityPage(entries);

  return (
    <section className="forever-ladder" aria-label="Ladder">
      <div className="forever-ladder-cols">
        <span className="eyebrow">Character</span>
        <span className="eyebrow">Level</span>
      </div>
      <ol className="forever-ladder-rows">
        {pageItems.map((entry, index) => (
          <ForeverLadderRow
            key={characterKey(entry.character)}
            position={startIndex + index + 1}
            entry={entry}
          />
        ))}
        {pending.map(({ entity, status }) => (
          <ForeverPendingRow key={characterKey(entity)} character={entity} status={status} />
        ))}
      </ol>
      <Pager label="Ladder pages" pagination={pagination} />
    </section>
  );
}
