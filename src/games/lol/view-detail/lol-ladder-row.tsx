import { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { formatRank } from '@/games/lol/ranked.ts';
import { profileIconUrl } from '@/games/lol/data-dragon.ts';
import { TIER_IMAGES } from '@/games/lol/tier-images.ts';
import { LadderEntry } from './ladder.ts';
import { PlayerDetails } from './player-details/player-details.tsx';

interface LolLadderRowProps {
  entry: LadderEntry;
  dataDragonVersion: string | undefined;
}

export function LolLadderRow({ entry, dataDragonVersion }: Readonly<LolLadderRowProps>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { player, league, lpChange, standing } = entry;
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
      <tr className={league ? 'lol-row' : 'lol-row lol-row--unranked'}>
        <td className="lol-cell-standing num">{standing ?? '—'}</td>
        <td>
          {league ? (
            <button
              type="button"
              className="lol-player lol-player-toggle"
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded((prev) => !prev)}
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
              <span>{formatRank(league)}</span>
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
        <td className="lol-cell-secondary num">{league?.gamesPlayed}</td>
        <td className="lol-cell-secondary num">
          {league && `${Math.round(league.winrate * 100)}%`}
        </td>
        <td className="lol-cell-link">
          <a
            href={opggUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${riotId} on op.gg`}
            title="Open on op.gg"
          >
            <ExternalLink className="lol-link-icon" />
          </a>
        </td>
      </tr>
      {isExpanded && league && (
        <tr className="lol-details-row">
          <td colSpan={8}>
            <PlayerDetails playerName={player.summonerName} matches={league.matches} />
          </td>
        </tr>
      )}
    </>
  );
}
