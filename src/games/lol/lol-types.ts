export type Queue = 'solo' | 'flex';

export const QUEUE_KEYS: Record<Queue, 'SOLO_Q' | 'FLEX_Q'> = {
  solo: 'SOLO_Q',
  flex: 'FLEX_Q',
};

export type Position = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY';

export interface League {
  tier: string;
  rank: string;
  leaguePoints: number;
  gamesPlayed: number;
  winrate: number;
  teamPosition: string;
}

export interface LolPlayer {
  type: 'lol';
  summonerIcon: number;
  summonerLevel: number;
  summonerName: string;
  summonerTag: string;
  leagues: Partial<Record<(typeof QUEUE_KEYS)[Queue], League>>;
}
