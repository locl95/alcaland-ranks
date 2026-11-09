import { useMemo } from 'react';
import { PendingEntity } from '@/features/views/hooks/useSaveEntities.ts';
import { useEntityPage } from '@/features/views/hooks/useEntityPage.ts';
import { Pager } from '@/features/views/components/shared/pager.tsx';
import { CharacterRef, characterKey } from '@/games/wow/forever/model/character.ts';
import { ForeverCharacter } from '@/games/wow/forever/api/forever-types.ts';
import { buildLadder } from '@/games/wow/forever/model/ladder.ts';
import { ForeverLadderRow } from './forever-ladder-row.tsx';
import { ForeverPendingRow } from './forever-pending-row.tsx';
import './forever-ladder.css';

interface ForeverLadderProps {
  characters: ForeverCharacter[];
  cachedCharacters: ForeverCharacter[];
  pending: PendingEntity<CharacterRef>[];
}

export function ForeverLadder({
  characters,
  cachedCharacters,
  pending,
}: Readonly<ForeverLadderProps>) {
  const entries = useMemo(
    () => buildLadder(characters, cachedCharacters),
    [characters, cachedCharacters],
  );
  const { pageItems, startIndex, pagination } = useEntityPage(entries);

  return (
    <section className="forever-ladder" aria-label="Ladder">
      <div className="forever-ladder-cols">
        <span className="eyebrow">Character</span>
        <span className="eyebrow forever-col-ilvl">iLvl</span>
        <span className="eyebrow forever-col-level">Level</span>
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
