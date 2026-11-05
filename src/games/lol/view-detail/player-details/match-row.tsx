import { LolMatch } from '@/games/lol/lol-types.ts';
import { positionOf } from '@/games/lol/positions.ts';
import { ChampionIcon } from './champion-icon.tsx';
import { formatKda, formatMinutes, kda, RESULT_LABEL, resultOf } from './match-stats.ts';

interface MatchRowProps {
  match: LolMatch;
  onOpen: (match: LolMatch) => void;
}

export function MatchRow({ match, onOpen }: Readonly<MatchRowProps>) {
  const result = resultOf(match);
  const position = positionOf(match.individualPosition);

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
        <span className="lol-match-ratio num">
          {result !== 'remake' && formatKda(kda(match.kills, match.deaths, match.assists))}
        </span>
        <span className="lol-match-result">{RESULT_LABEL[result]}</span>
        <span className="lol-match-duration num">{formatMinutes(match.gameDuration)}</span>
      </button>
    </li>
  );
}
