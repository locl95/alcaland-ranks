import { useEntityPage } from '@/features/views/hooks/useEntityPage.ts';
import { Pager } from '@/features/views/components/shared/pager.tsx';
import { characterKey } from '@/games/wow-forever/model/character.ts';
import { LadderEntry } from '@/games/wow-forever/model/ladder.ts';
import { ForeverLadderRow } from './forever-ladder-row.tsx';
import './forever-ladder.css';

interface ForeverLadderProps {
  entries: LadderEntry[];
}

export function ForeverLadder({ entries }: Readonly<ForeverLadderProps>) {
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
      </ol>
      <Pager label="Ladder pages" pagination={pagination} />
    </section>
  );
}
