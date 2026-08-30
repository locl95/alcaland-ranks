import { ChevronDown, ChevronUp } from 'lucide-react';
import keystone from '@/assets/keystone.webp';
import './character-ladder.css';
import { memo, useMemo, useState } from 'react';
import { RaiderioProfile, Season } from '@/features/views/api/raiderio.ts';
import { useEntityPage } from '@/features/views/hooks/useEntityPage.ts';
import { LadderRow } from './ladder-row.tsx';
import { Pager } from '@/features/views/components/shared/pager.tsx';

interface CharacterLadderProps {
  characters: RaiderioProfile[];
  cachedCharacters: RaiderioProfile[];
  season: Season | null;
}

export const CharacterLadder = memo(function CharacterLadder({
  characters,
  cachedCharacters,
  season,
}: Readonly<CharacterLadderProps>) {
  const [isLadderOpen, setIsLadderOpen] = useState(true);
  const sortedCharacters = useMemo(
    () => [...characters].sort((a, b) => (b.score ?? -1) - (a.score ?? -1)),
    [characters],
  );
  const sortedCachedCharacters = useMemo(
    () => [...cachedCharacters].sort((a, b) => (b.score ?? -1) - (a.score ?? -1)),
    [cachedCharacters],
  );

  const { pageItems, startIndex, pagination } = useEntityPage(sortedCharacters);

  return (
    <div className="ladder-card">
      <div className="ladder-header" onClick={() => setIsLadderOpen(!isLadderOpen)}>
        <div className="ladder-title">
          <img src={keystone} alt="" aria-hidden={true} className="keystone-icon" />
          Ladder
        </div>
        <button className="ladder-toggle-btn">
          {isLadderOpen ? (
            <ChevronUp className="chevron-icon" />
          ) : (
            <ChevronDown className="chevron-icon" />
          )}
        </button>
      </div>

      {isLadderOpen && (
        <>
          <div className="ladder-cols">
            <span className="eyebrow">Character</span>
            <span className="eyebrow ladder-cols-score">M+ score</span>
          </div>
          <div className="ladder-content">
            {pageItems.map((character, index) => (
              <LadderRow
                key={character.id}
                index={startIndex + index}
                character={character}
                cachedCharacters={sortedCachedCharacters}
                season={season}
              />
            ))}
          </div>
          <Pager label="Ladder pages" pagination={pagination} />
        </>
      )}
    </div>
  );
});
