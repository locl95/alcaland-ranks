import { useMemo, useState } from 'react';
import { PendingEntity } from '@/features/views/hooks/useSaveEntities.ts';
import { useEntityPage } from '@/features/views/hooks/useEntityPage.ts';
import { usePageSize } from '@/features/views/hooks/usePageSize.ts';
import { Pager } from '@/features/views/components/shared/pager.tsx';
import {
  CharacterRef,
  characterKey,
  formatCharacterName,
} from '@/games/wow/forever/model/character.ts';
import { ForeverCharacter } from '@/games/wow/forever/api/forever-types.ts';
import {
  DEFAULT_SORT,
  LadderSort,
  buildLadder,
  sortLadder,
} from '@/games/wow/forever/model/ladder.ts';
import { matchesName } from '@/games/wow/name-search.ts';
import { LadderSearch } from '@/games/wow/components/ladder-search.tsx';
import { LadderToolbar } from '@/games/wow/components/ladder-toolbar.tsx';
import { LadderNoResults } from '@/games/wow/components/ladder-no-results.tsx';
import { CLASS_IMAGES, getClassImageKey } from '@/games/wow/class-images.ts';
import { RACE_IMAGES, getRaceImageKey } from '@/games/wow/forever/assets/race-images.ts';
import { IconFilter } from '@/games/wow/components/icon-filter.tsx';
import { SortHeader } from '@/games/wow/components/sort-header.tsx';
import { nextSort } from '@/games/wow/column-sort.ts';
import { ForeverLadderRow } from './forever-ladder-row.tsx';
import { ForeverPendingRow } from './forever-pending-row.tsx';
import './forever-ladder.css';

const uniqueSorted = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

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
  const [search, setSearch] = useState('');
  const [pickedClass, setPickedClass] = useState('');
  const [pickedRace, setPickedRace] = useState('');
  const [sort, setSort] = useState<LadderSort>(DEFAULT_SORT);
  // The options come from the ladder itself, so there is no list of classes or races to keep up.
  const classes = useMemo(
    () => uniqueSorted(characters.map((c) => c.characterClass)),
    [characters],
  );
  const races = useMemo(() => uniqueSorted(characters.map((c) => c.race)), [characters]);
  // A pick the ladder no longer has (its last character was removed) stops filtering.
  const characterClass = classes.includes(pickedClass) ? pickedClass : '';
  const race = races.includes(pickedRace) ? pickedRace : '';
  // Each entry keeps its real standing, so a filtered or sorted row still shows its place in the ladder.
  const visibleEntries = useMemo(
    () =>
      sortLadder(
        entries
          .map((entry, index) => ({ entry, position: index + 1 }))
          .filter(
            ({ entry: { character } }) =>
              (!characterClass || character.characterClass === characterClass) &&
              (!race || character.race === race) &&
              matchesName(formatCharacterName(character), search),
          ),
        sort,
      ),
    [entries, characterClass, race, search, sort],
  );
  // A pending character has no class or race yet, so it can only match an unfiltered ladder.
  const visiblePending =
    characterClass || race
      ? []
      : pending.filter(({ entity }) => matchesName(formatCharacterName(entity), search));
  // Sized by the whole ladder, so the options hold still while the filters narrow it.
  const pageSize = usePageSize(entries.length);
  const { pageItems, pagination } = useEntityPage(visibleEntries, pageSize.rowsPerPage);

  const filterBy = (set: (value: string) => void) => (value: string) => {
    set(value);
    pagination.goFirst();
  };
  const sortBy = (key: LadderSort['key']) => {
    setSort((s) => nextSort(s, key));
    pagination.goFirst();
  };

  return (
    <section className="forever-ladder" aria-label="Ladder">
      <LadderToolbar>
        <IconFilter
          label="Class"
          options={classes}
          iconOf={(c) => CLASS_IMAGES[getClassImageKey(c)]}
          value={characterClass}
          onChange={filterBy(setPickedClass)}
        />
        <IconFilter
          label="Race"
          options={races}
          iconOf={(r) => RACE_IMAGES[getRaceImageKey(r)]}
          value={race}
          onChange={filterBy(setPickedRace)}
        />
        <LadderSearch value={search} onChange={filterBy(setSearch)} />
      </LadderToolbar>
      <div className="forever-ladder-cols">
        <span className="eyebrow">Character</span>
        <SortHeader
          label="iLvl"
          sortKey="ilvl"
          sort={sort}
          onSort={sortBy}
          className="forever-col-ilvl"
        />
        <SortHeader
          label="Level"
          sortKey="level"
          sort={sort}
          onSort={sortBy}
          className="forever-col-level"
        />
        <span className="forever-col-chevron" aria-hidden={true} />
      </div>
      <ol className="forever-ladder-rows">
        {pageItems.map(({ entry, position }) => (
          <ForeverLadderRow key={characterKey(entry.character)} position={position} entry={entry} />
        ))}
        {visiblePending.map(({ entity, status }) => (
          <ForeverPendingRow key={characterKey(entity)} character={entity} status={status} />
        ))}
      </ol>
      {visibleEntries.length === 0 && visiblePending.length === 0 && <LadderNoResults />}
      <Pager label="Ladder pages" pagination={pagination} pageSize={pageSize} />
    </section>
  );
}
