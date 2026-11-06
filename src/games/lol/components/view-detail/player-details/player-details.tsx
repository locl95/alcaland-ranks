import { useState } from 'react';
import { LolMatch } from '@/games/lol/api/lol-types.ts';
import { positionOf } from '@/games/lol/model/positions.ts';
import { useChampion } from '@/games/lol/api/data-dragon.ts';
import { ChampionIcon } from './champion-icon.tsx';
import { MatchRow } from './match-row.tsx';
import { MatchupDialog } from './matchup-dialog.tsx';
import {
  formatKda,
  kdaTier,
  roleSplit,
  summarize,
  topChampions,
  winrateTone,
} from '@/games/lol/model/match-stats.ts';
import '@/games/lol/components/shared/stat-tones.css';
import './player-details.css';

interface PlayerDetailsProps {
  playerName: string;
  matches: LolMatch[];
}

const percent = (value: number) => `${Math.round(value * 100)}%`;

export function PlayerDetails({ playerName, matches }: Readonly<PlayerDetailsProps>) {
  const [openMatch, setOpenMatch] = useState<LolMatch | null>(null);
  const champion = useChampion();

  if (matches.length === 0) {
    return <p className="lol-details-empty">No recent games in this queue.</p>;
  }

  const summary = summarize(matches);
  const champions = topChampions(matches);
  const roles = roleSplit(matches);
  const mostPlayedRole = Math.max(...roles.map((r) => r.games), 1);

  return (
    <div className="lol-details">
      <p className="lol-details-summary">
        <span className="eyebrow">Last {matches.length} games</span>
        <span className="num">
          {summary.wins}W {summary.losses}L
        </span>
        {summary.winrate !== null && (
          <span className={`lol-details-winrate num lol-tone--${winrateTone(summary.winrate)}`}>
            {percent(summary.winrate)}
          </span>
        )}
        {summary.remakes > 0 && (
          <span className="lol-details-remakes">
            ({summary.remakes} {summary.remakes === 1 ? 'remake' : 'remakes'} not counted)
          </span>
        )}
      </p>

      <div className="lol-details-columns">
        <section aria-label="Most played champions">
          <h4 className="eyebrow lol-details-heading">Most played</h4>
          <ul className="lol-champions">
            {champions.map((c) => (
              <li key={c.championId} className="lol-champion">
                <ChampionIcon
                  className="lol-champion-icon"
                  championId={c.championId}
                  championName={c.championName}
                />
                <span className="lol-champion-name">
                  {champion(c.championId)?.name ?? c.championName}
                </span>
                <span className="lol-champion-games num">
                  {c.games} {c.games === 1 ? 'game' : 'games'}
                </span>
                <span className={`num lol-tone--${winrateTone(c.wins / c.games)}`}>
                  {percent(c.wins / c.games)}
                </span>
                <span className={`lol-champion-kda num lol-kda--${kdaTier(c.kda)}`}>
                  {formatKda(c.kda)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Roles">
          <h4 className="eyebrow lol-details-heading">Roles</h4>
          <ul className="lol-roles">
            {roles.map(({ position, games }) => {
              const role = positionOf(position)!;
              return (
                <li key={position} className="lol-role">
                  <img src={role.icon} alt={role.label} title={role.label} />
                  <span className="lol-role-bar">
                    <span
                      className="lol-role-fill"
                      style={{ width: `${(games / mostPlayedRole) * 100}%` }}
                    />
                  </span>
                  <span className="num">{games}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section aria-label="Matches">
        <h4 className="eyebrow lol-details-heading">Matches</h4>
        <ul className="lol-matches">
          {matches.map((match) => (
            <MatchRow key={match.id} match={match} onOpen={setOpenMatch} />
          ))}
        </ul>
      </section>

      {openMatch && (
        <MatchupDialog
          playerName={playerName}
          match={openMatch}
          onClose={() => setOpenMatch(null)}
        />
      )}
    </div>
  );
}
