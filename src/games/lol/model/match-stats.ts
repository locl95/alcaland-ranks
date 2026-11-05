import { LolMatch, Position } from '@/games/lol/api/lol-types.ts';
import { POSITIONS } from '@/games/lol/model/positions.ts';

const REMAKE_MAX_SECONDS = 300;

export const isRemake = (match: LolMatch): boolean =>
  !match.gameFinishedCorrectly || match.gameDuration < REMAKE_MAX_SECONDS;

export type MatchResult = 'win' | 'loss' | 'remake';

export const resultOf = (match: LolMatch): MatchResult =>
  isRemake(match) ? 'remake' : match.win ? 'win' : 'loss';

export const RESULT_LABEL: Record<MatchResult, string> = {
  win: 'Win',
  loss: 'Loss',
  remake: 'Remake',
};

export const formatMinutes = (seconds: number): string => `${Math.round(seconds / 60)}m`;

export const kda = (kills: number, deaths: number, assists: number): number | 'perfect' =>
  deaths === 0 ? 'perfect' : (kills + assists) / deaths;

export const formatKda = (ratio: number | 'perfect'): string =>
  ratio === 'perfect' ? 'Perfect' : `${ratio.toFixed(1)} KDA`;

export interface MatchSummary {
  wins: number;
  losses: number;
  remakes: number;
  winrate: number | null;
}

export function summarize(matches: LolMatch[]): MatchSummary {
  const counted = matches.filter((m) => !isRemake(m));
  const wins = counted.filter((m) => m.win).length;
  return {
    wins,
    losses: counted.length - wins,
    remakes: matches.length - counted.length,
    winrate: counted.length ? wins / counted.length : null,
  };
}

export interface ChampionStats {
  championId: number;
  championName: string;
  games: number;
  wins: number;
  kda: number | 'perfect';
}

export function topChampions(matches: LolMatch[], limit = 5): ChampionStats[] {
  const byChampion = new Map<number, LolMatch[]>();
  for (const match of matches.filter((m) => !isRemake(m))) {
    byChampion.set(match.championId, [...(byChampion.get(match.championId) ?? []), match]);
  }
  return [...byChampion.values()]
    .map((games) => {
      const total = (key: 'kills' | 'deaths' | 'assists') =>
        games.reduce((sum, g) => sum + g[key], 0);
      return {
        championId: games[0].championId,
        championName: games[0].championName,
        games: games.length,
        wins: games.filter((g) => g.win).length,
        kda: kda(total('kills'), total('deaths'), total('assists')),
      };
    })
    .sort((a, b) => b.games - a.games || b.wins - a.wins)
    .slice(0, limit);
}

export interface RoleShare {
  position: Position;
  games: number;
  wins: number;
}

export const roleSplit = (matches: LolMatch[]): RoleShare[] => {
  const counted = matches.filter((m) => !isRemake(m));
  return POSITIONS.map(({ key }) => {
    const games = counted.filter((m) => m.individualPosition === key);
    return { position: key, games: games.length, wins: games.filter((g) => g.win).length };
  });
};
