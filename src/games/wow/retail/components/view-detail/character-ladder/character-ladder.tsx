import { ChevronDown, ChevronUp } from 'lucide-react';
import keystone from '@/games/wow/retail/assets/keystone.webp';
import './character-ladder.css';
import { memo, useMemo, useState } from 'react';
import { WowProfile, Season } from '@/games/wow/retail/api/wow-types.ts';
import { useEntityPage } from '@/features/views/hooks/useEntityPage.ts';
import { usePageSize } from '@/features/views/hooks/usePageSize.ts';
import { EntityStatus } from '@/features/views/hooks/useSaveEntities.ts';
import { characterKey } from '@/games/wow/retail/utils.ts';
import { LadderRow } from './ladder-row.tsx';
import { Pager } from '@/features/views/components/shared/pager.tsx';
import { matchesName } from '@/games/wow/name-search.ts';
import { LadderSearch } from '@/games/wow/components/ladder-search.tsx';
import { LadderToolbar } from '@/games/wow/components/ladder-toolbar.tsx';
import { LadderNoResults } from '@/games/wow/components/ladder-no-results.tsx';
import { IconFilter } from '@/games/wow/components/icon-filter.tsx';
import { SortHeader } from '@/games/wow/components/sort-header.tsx';
import { CLASS_IMAGES, getClassImageKey } from '@/games/wow/class-images.ts';
import { nextSort } from '@/games/wow/column-sort.ts';
import { DEFAULT_SORT, LadderSort, sortLadder } from '@/games/wow/retail/model/ladder.ts';

interface CharacterLadderProps {
  characters: WowProfile[];
  pendingStatuses: Map<string, EntityStatus>;
  cachedCharacters: WowProfile[];
  season: Season | null;
}

export const CharacterLadder = memo(function CharacterLadder({
  characters,
  pendingStatuses,
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

  const [search, setSearch] = useState('');
  const [pickedClass, setPickedClass] = useState('');
  const [sort, setSort] = useState<LadderSort>(DEFAULT_SORT);
  // The options come from the ladder itself; a character still syncing has no class yet.
  const classes = useMemo(
    () =>
      [...new Set(characters.filter((c) => c.score !== null).map((c) => c.class))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [characters],
  );
  // A pick the ladder no longer has (its last character was removed) stops filtering.
  const characterClass = classes.includes(pickedClass) ? pickedClass : '';
  // Each character keeps its real standing, so a filtered or sorted row still shows its rank and movement.
  const visibleCharacters = useMemo(
    () =>
      sortLadder(
        sortedCharacters
          .map((character, index) => ({ character, index }))
          .filter(
            ({ character }) =>
              (!characterClass || character.class === characterClass) &&
              matchesName(character.name, search),
          ),
        sort,
      ),
    [sortedCharacters, characterClass, search, sort],
  );

  // Sized by the whole ladder, so the options hold still while the search narrows it.
  const pageSize = usePageSize(sortedCharacters.length);
  const { pageItems, pagination } = useEntityPage(visibleCharacters, pageSize.rowsPerPage);

  const filterBy = (set: (value: string) => void) => (value: string) => {
    set(value);
    pagination.goFirst();
  };
  const sortBy = (key: LadderSort['key']) => {
    setSort((s) => nextSort(s, key));
    pagination.goFirst();
  };

  return (
    <div className="ladder-card">
      {/* The toggle stretches over the whole header, so a click anywhere on it folds the
          ladder; the filters and search sit above it and take their own clicks. */}
      <div className="ladder-header">
        <button
          type="button"
          className="ladder-header-toggle"
          aria-expanded={isLadderOpen}
          onClick={() => setIsLadderOpen((wasOpen) => !wasOpen)}
        >
          <span className="ladder-title">
            <img src={keystone} alt="" aria-hidden={true} className="keystone-icon" />
            Ladder
          </span>
        </button>
        {isLadderOpen && (
          <LadderToolbar>
            <IconFilter
              label="Class"
              options={classes}
              iconOf={(c) => CLASS_IMAGES[getClassImageKey(c)]}
              value={characterClass}
              onChange={filterBy(setPickedClass)}
            />
            <LadderSearch value={search} onChange={filterBy(setSearch)} />
          </LadderToolbar>
        )}
        {isLadderOpen ? (
          <ChevronUp className="chevron-icon ladder-header-chevron" aria-hidden={true} />
        ) : (
          <ChevronDown className="chevron-icon ladder-header-chevron" aria-hidden={true} />
        )}
      </div>

      {isLadderOpen && (
        <>
          <div className="ladder-cols">
            <span className="eyebrow">Character</span>
            <SortHeader
              label="iLvl"
              sortKey="ilvl"
              sort={sort}
              onSort={sortBy}
              className="ladder-col-ilvl"
            />
            <SortHeader
              label="M+ score"
              sortKey="score"
              sort={sort}
              onSort={sortBy}
              className="ladder-col-score"
            />
          </div>
          <div className="ladder-content">
            {pageItems.map(({ character, index }) => (
              <LadderRow
                key={character.id}
                index={index}
                character={character}
                pendingStatus={pendingStatuses.get(characterKey(character))}
                cachedCharacters={sortedCachedCharacters}
                season={season}
              />
            ))}
          </div>
          {visibleCharacters.length === 0 && <LadderNoResults />}
          <Pager label="Ladder pages" pagination={pagination} pageSize={pageSize} />
        </>
      )}
    </div>
  );
});
