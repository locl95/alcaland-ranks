import { LolMatch } from '@/games/lol/api/lol-types.ts';
import { resultOf, summarize } from '@/games/lol/model/match-stats.ts';
import './recent-form.css';

interface RecentFormProps {
  matches: LolMatch[];
}

export function RecentForm({ matches }: Readonly<RecentFormProps>) {
  if (matches.length === 0) return null;
  const { wins, losses } = summarize(matches);

  return (
    <span
      className="lol-form"
      role="img"
      aria-label={`Last ${matches.length} games: ${wins} wins, ${losses} losses`}
    >
      {matches.map((match) => (
        <span key={match.id} className={`lol-form-mark lol-form-mark--${resultOf(match)}`} />
      ))}
    </span>
  );
}
