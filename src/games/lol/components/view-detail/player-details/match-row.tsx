import { LolMatch } from '@/games/lol/api/lol-types.ts';
import { positionOf } from '@/games/lol/model/positions.ts';
import '@/games/lol/components/shared/stat-tones.css';
import { ChampionIcon } from './champion-icon.tsx';
import {
  formatKda,
  formatMinutes,
  kda,
  kdaTier,
  RESULT_LABEL,
  resultOf,
} from '@/games/lol/model/match-stats.ts';

interface MatchRowProps {
  match: LolMatch;
  onOpen: (match: LolMatch) => void;
}

export function MatchRow({ match, onOpen }: Readonly<MatchRowProps>) {
  const result = resultOf(match);
  const position = positionOf(match.individualPosition);
  const ratio = kda(match.kills, match.deaths, match.assists);
  const { matchUp } = match;

  return (
    <li>
      <button
        type="button"
        className={`lol-match lol-match--${result}`}
        onClick={() => onOpen(match)}
      >
        <ChampionIcon
          className="lol-match-champion"
          championId={match.championId}
          championName={match.championName}
        />
        {position && (
          <img
            className="lol-match-position"
            src={position.icon}
            alt={position.label}
            title={position.label}
          />
        )}
        <span className="lol-match-kda num">
          {match.kills}/{match.deaths}/{match.assists}
        </span>
        <span className={`lol-match-ratio num lol-kda--${kdaTier(ratio)}`}>
          {result !== 'remake' && formatKda(ratio)}
        </span>
        <span className="lol-match-vs">
          {matchUp && (
            <>
              <span className="lol-match-vs-label">vs</span>
              <ChampionIcon
                className="lol-match-vs-champion"
                championId={matchUp.championId}
                championName={matchUp.championName}
              />
              <span className="lol-match-vs-kda num">
                {matchUp.kills}/{matchUp.deaths}/{matchUp.assists}
              </span>
            </>
          )}
        </span>
        <span className="lol-match-result">{RESULT_LABEL[result]}</span>
        <span className="lol-match-duration num">{formatMinutes(match.gameDuration)}</span>
      </button>
    </li>
  );
}
