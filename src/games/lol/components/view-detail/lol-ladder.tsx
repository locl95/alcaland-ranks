import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { LolPlayer, Position, Queue } from '@/games/lol/api/lol-types.ts';
import { useDataDragonVersion } from '@/games/lol/api/data-dragon.ts';
import { POSITIONS } from '@/games/lol/model/positions.ts';
import {
  buildLadder,
  matchesFilters,
  Sort,
  SortKey,
  sortLadder,
} from '@/games/lol/model/ladder.ts';
import { PendingEntity } from '@/features/views/hooks/useSaveEntities.ts';
import { RiotId } from '@/games/lol/model/riot-id.ts';
import { LolLadderRow } from './lol-ladder-row.tsx';
import { LolPendingRow } from './lol-pending-row.tsx';
import './lol-ladder.css';

const COLUMNS: { label: string; sortKey?: SortKey; className?: string }[] = [
  { label: 'Player', sortKey: 'name' },
  { label: 'Level', sortKey: 'level', className: 'lol-cell-secondary' },
  { label: 'Rank', sortKey: 'rank' },
  { label: 'LP gain', sortKey: 'change' },
  { label: 'Form', className: 'lol-cell-secondary' },
  { label: 'Games', sortKey: 'games', className: 'lol-cell-secondary' },
  { label: 'Winrate', sortKey: 'winrate', className: 'lol-cell-secondary' },
];

interface LolLadderProps {
  players: LolPlayer[];
  cachedPlayers: LolPlayer[];
  pending: PendingEntity<RiotId>[];
  queue: Queue;
  onQueueChange: (queue: Queue) => void;
}

export function LolLadder({
  players,
  cachedPlayers,
  pending,
  queue,
  onQueueChange,
}: Readonly<LolLadderProps>) {
  const [sort, setSort] = useState<Sort>({ key: 'rank', descending: true });
  const [position, setPosition] = useState<Position | null>(null);
  const [search, setSearch] = useState('');
  const dataDragonVersion = useDataDragonVersion();

  const ladder = useMemo(
    () => buildLadder(players, cachedPlayers, queue),
    [players, cachedPlayers, queue],
  );
  const visibleEntries = sortLadder(
    ladder.filter((entry) => matchesFilters(entry, position, search)),
    sort,
  );

  const sortBy = (key: SortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, descending: !current.descending }
        : { key, descending: key !== 'name' },
    );

  return (
    <div className="lol-ladder">
      <div className="lol-toolbar">
        <div className="lol-segmented" role="group" aria-label="Queue">
          {(['solo', 'flex'] as const).map((q) => (
            <button
              key={q}
              type="button"
              className={`lol-segmented-btn${queue === q ? ' lol-segmented-btn--active' : ''}`}
              aria-pressed={queue === q}
              onClick={() => onQueueChange(q)}
            >
              {q === 'solo' ? 'Solo/Duo' : 'Flex'}
            </button>
          ))}
        </div>

        <div className="lol-positions" role="group" aria-label="Position">
          {POSITIONS.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              className={`lol-position-btn${position === key ? ' lol-position-btn--active' : ''}`}
              aria-pressed={position === key}
              aria-label={label}
              title={label}
              onClick={() => setPosition(position === key ? null : key)}
            >
              <img src={icon} alt="" aria-hidden={true} />
            </button>
          ))}
        </div>

        <label className="lol-search">
          <Search className="lol-search-icon" aria-hidden={true} />
          <input
            className="form-input"
            type="search"
            placeholder="Search player or tier"
            aria-label="Search player or tier"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      <div className="lol-table-wrap">
        <table className="lol-table">
          <thead>
            <tr>
              <th className="lol-cell-standing" scope="col">
                #
              </th>
              {COLUMNS.map(({ label, sortKey, className }) => (
                <th
                  key={label}
                  scope="col"
                  className={className}
                  aria-sort={
                    sortKey && sort.key === sortKey
                      ? sort.descending
                        ? 'descending'
                        : 'ascending'
                      : undefined
                  }
                >
                  {sortKey ? (
                    <button type="button" className="lol-sort-btn" onClick={() => sortBy(sortKey)}>
                      {label}
                      {sort.key === sortKey &&
                        (sort.descending ? (
                          <ChevronDown className="lol-sort-icon" aria-hidden={true} />
                        ) : (
                          <ChevronUp className="lol-sort-icon" aria-hidden={true} />
                        ))}
                    </button>
                  ) : (
                    <span className="lol-col-label">{label}</span>
                  )}
                </th>
              ))}
              <th className="lol-cell-link" scope="col">
                <span className="lol-sr-only">op.gg</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleEntries.map((entry) => (
              <LolLadderRow
                key={`${entry.player.summonerName}#${entry.player.summonerTag}`}
                entry={entry}
                dataDragonVersion={dataDragonVersion}
              />
            ))}
            {pending.map(({ entity, status }) => (
              <LolPendingRow key={`${entity.name}#${entity.tag}`} riotId={entity} status={status} />
            ))}
          </tbody>
        </table>
        {visibleEntries.length === 0 && pending.length === 0 && (
          <p className="lol-no-results">No players match.</p>
        )}
      </div>
    </div>
  );
}
