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
import { LolLadderRow } from './lol-ladder-row.tsx';
import './lol-ladder.css';

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: 'name', label: 'Player' },
  { key: 'level', label: 'Level', className: 'lol-cell-secondary' },
  { key: 'rank', label: 'Rank' },
  { key: 'change', label: 'Change' },
  { key: 'games', label: 'Games', className: 'lol-cell-secondary' },
  { key: 'winrate', label: 'Winrate', className: 'lol-cell-secondary' },
];

interface LolLadderProps {
  players: LolPlayer[];
  cachedPlayers: LolPlayer[];
  queue: Queue;
  onQueueChange: (queue: Queue) => void;
}

export function LolLadder({
  players,
  cachedPlayers,
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
              {COLUMNS.map(({ key, label, className }) => (
                <th
                  key={key}
                  scope="col"
                  className={className}
                  aria-sort={
                    sort.key === key ? (sort.descending ? 'descending' : 'ascending') : undefined
                  }
                >
                  <button type="button" className="lol-sort-btn" onClick={() => sortBy(key)}>
                    {label}
                    {sort.key === key &&
                      (sort.descending ? (
                        <ChevronDown className="lol-sort-icon" aria-hidden={true} />
                      ) : (
                        <ChevronUp className="lol-sort-icon" aria-hidden={true} />
                      ))}
                  </button>
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
          </tbody>
        </table>
        {visibleEntries.length === 0 && <p className="lol-no-results">No players match.</p>}
      </div>
    </div>
  );
}
