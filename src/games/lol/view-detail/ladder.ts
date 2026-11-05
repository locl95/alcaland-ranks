import { riotIdKey } from '@/games/lol/riot-id.ts';
import { League, LolPlayer, Position, Queue, QUEUE_KEYS } from '@/games/lol/lol-types.ts';
import { lpChange, totalLp } from '@/games/lol/ranked.ts';

export interface LadderEntry {
  player: LolPlayer;
  league: League | null;
  lpChange: number | null;
  standing: number | null;
}

export type SortKey = 'rank' | 'name' | 'level' | 'change' | 'games' | 'winrate';

export interface Sort {
  key: SortKey;
  descending: boolean;
}

const playerKey = (p: LolPlayer) => riotIdKey({ name: p.summonerName, tag: p.summonerTag });

export function buildLadder(
  players: LolPlayer[],
  cachedPlayers: LolPlayer[],
  queue: Queue,
): LadderEntry[] {
  const queueKey = QUEUE_KEYS[queue];
  const previous = new Map(cachedPlayers.map((p) => [playerKey(p), p.leagues[queueKey] ?? null]));

  const standings = players
    .flatMap((p) => p.leagues[queueKey] ?? [])
    .map(totalLp)
    .sort((a, b) => b - a);

  return players.map((player) => {
    const league = player.leagues[queueKey] ?? null;
    return {
      player,
      league,
      lpChange: lpChange(league, previous.get(playerKey(player)) ?? null),
      standing: league && standings.indexOf(totalLp(league)) + 1,
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
