import { riotIdKey } from '@/games/lol/model/riot-id.ts';
import { League, LolPlayer, Position, Queue, QUEUE_KEYS } from '@/games/lol/api/lol-types.ts';
import { lpChange, totalLp } from '@/games/lol/model/ranked.ts';

export interface LadderEntry {
  player: LolPlayer;
  league: League | null;
  lpChange: number | null;
  standing: number | null;
  standingChange: number | null;
}

export type SortKey = 'rank' | 'name' | 'level' | 'change' | 'games' | 'winrate';

export interface Sort {
  key: SortKey;
  descending: boolean;
}

const playerKey = (p: LolPlayer) => riotIdKey({ name: p.summonerName, tag: p.summonerTag });

const standingsOf = (players: LolPlayer[], queueKey: (typeof QUEUE_KEYS)[Queue]): number[] =>
  players
    .flatMap((p) => p.leagues[queueKey] ?? [])
    .map(totalLp)
    .sort((a, b) => b - a);

const standingIn = (standings: number[], league: League): number =>
  standings.indexOf(totalLp(league)) + 1;

export function buildLadder(
  players: LolPlayer[],
  cachedPlayers: LolPlayer[],
  queue: Queue,
): LadderEntry[] {
  const queueKey = QUEUE_KEYS[queue];
  const previous = new Map(cachedPlayers.map((p) => [playerKey(p), p.leagues[queueKey] ?? null]));

  const standings = standingsOf(players, queueKey);
  const previousStandings = standingsOf(cachedPlayers, queueKey);

  return players.map((player) => {
    const league = player.leagues[queueKey] ?? null;
    const previousLeague = previous.get(playerKey(player)) ?? null;
    const standing = league && standingIn(standings, league);
    return {
      player,
      league,
      lpChange: lpChange(league, previousLeague),
      standing,
      standingChange:
        standing && previousLeague
          ? standingIn(previousStandings, previousLeague) - standing
          : null,
    };
  });
}

const SORT_VALUE: Record<SortKey, (entry: LadderEntry) => number | string | null> = {
  rank: (e) => e.league && totalLp(e.league),
  name: (e) => e.player.summonerName.toLowerCase(),
  level: (e) => e.player.summonerLevel,
  change: (e) => e.lpChange,
  games: (e) => e.league?.gamesPlayed ?? null,
  winrate: (e) => e.league?.winrate ?? null,
};

export function sortLadder(entries: LadderEntry[], { key, descending }: Sort): LadderEntry[] {
  const valueOf = SORT_VALUE[key];
  return [...entries].sort((a, b) => {
    const va = valueOf(a);
    const vb = valueOf(b);
    if (va === null || vb === null) return va === vb ? 0 : va === null ? 1 : -1;
    const order = va < vb ? -1 : va > vb ? 1 : 0;
    return descending ? -order : order;
  });
}

export const matchesFilters = (
  { player, league }: LadderEntry,
  position: Position | null,
  search: string,
): boolean => {
  if (position && league?.teamPosition !== position) return false;
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return [`${player.summonerName}#${player.summonerTag}`, league?.tier ?? 'unranked'].some((text) =>
    text.toLowerCase().includes(query),
  );
};
