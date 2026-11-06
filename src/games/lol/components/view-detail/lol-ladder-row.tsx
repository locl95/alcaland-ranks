import { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { formatTier } from '@/games/lol/model/ranked.ts';
import { winrateTone } from '@/games/lol/model/match-stats.ts';
import { profileIconUrl } from '@/games/lol/api/data-dragon.ts';
import { TIER_IMAGES } from '@/games/lol/assets/tier-images.ts';
import { LadderEntry } from '@/games/lol/model/ladder.ts';
import { PlayerDetails } from './player-details/player-details.tsx';
import { RecentForm } from './recent-form.tsx';
import '@/games/lol/components/shared/stat-tones.css';

interface LolLadderRowProps {
  entry: LadderEntry;
  dataDragonVersion: string | undefined;
}

export function LolLadderRow({ entry, dataDragonVersion }: Readonly<LolLadderRowProps>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { player, league, lpChange, standing, standingChange } = entry;
  const riotId = `${player.summonerName}#${player.summonerTag}`;
  const opggUrl = `https://www.op.gg/summoners/euw/${encodeURIComponent(
    `${player.summonerName}-${player.summonerTag}`,
  )}`;

  const playerLabel = (
    <>
      {dataDragonVersion && (
        <img
          className="lol-player-icon"
          src={profileIconUrl(dataDragonVersion, player.summonerIcon)}
          alt=""
          aria-hidden={true}
        />
      )}
      <span className="lol-player-name">{player.summonerName}</span>
      <span className="lol-player-tag">#{player.summonerTag}</span>
    </>
  );

  return (
    <>
      <tr
        className={league ? 'lol-row lol-row--expandable' : 'lol-row lol-row--unranked'}
        onClick={league ? () => setIsExpanded((prev) => !prev) : undefined}
      >
        <td className="lol-cell-standing num">
          {standing ?? '—'}
          {standingChange !== null && standingChange !== 0 && (
            <span
              className={`lol-change lol-standing-change ${standingChange > 0 ? 'lol-change--up' : 'lol-change--down'}`}
            >
              {standingChange > 0 ? `↑ ${standingChange}` : `↓ ${Math.abs(standingChange)}`}
            </span>
          )}
        </td>
        <td>
          {league ? (
            <button
              type="button"
              className="lol-player lol-player-toggle"
              aria-expanded={isExpanded}
            >
              {playerLabel}
              <ChevronDown className="lol-player-chevron" aria-hidden={true} />
            </button>
          ) : (
            <div className="lol-player">{playerLabel}</div>
          )}
        </td>
        <td className="lol-cell-secondary num">{player.summonerLevel}</td>
        <td>
          {league ? (
            <div className="lol-rank">
              <img
                className="lol-rank-emblem"
                src={TIER_IMAGES[league.tier]}
                alt=""
                aria-hidden={true}
              />
              <span className="lol-rank-text">
                <span>{formatTier(league)}</span>
                <span className="lol-rank-lp">{league.leaguePoints} LP</span>
              </span>
            </div>
          ) : (
            <span className="lol-unranked">Unranked</span>
          )}
        </td>
        <td className="num">
          {lpChange !== null && lpChange !== 0 && (
            <span className={`lol-change ${lpChange > 0 ? 'lol-change--up' : 'lol-change--down'}`}>
              {lpChange > 0 ? `+${lpChange}` : `−${Math.abs(lpChange)}`}
            </span>
          )}
        </td>
        <td className="lol-cell-secondary">{league && <RecentForm matches={league.matches} />}</td>
        <td className="lol-cell-secondary num">{league?.gamesPlayed}</td>
        <td className="lol-cell-secondary num">
          {league && (
            <span className={`lol-tone--${winrateTone(league.winrate)}`}>
              {Math.round(league.winrate * 100)}%
            </span>
          )}
        </td>
        <td className="lol-cell-link">
          <a
            href={opggUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${riotId} on op.gg`}
            title="Open on op.gg"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="lol-link-icon" />
          </a>
        </td>
      </tr>
      {isExpanded && league && (
        <tr className="lol-details-row">
          <td colSpan={9}>
            <PlayerDetails playerName={player.summonerName} matches={league.matches} />
          </td>
        </tr>
      )}
    </>
  );
}
