export type Queue = 'solo' | 'flex';

export const QUEUE_KEYS: Record<Queue, 'SOLO_Q' | 'FLEX_Q'> = {
  solo: 'SOLO_Q',
  flex: 'FLEX_Q',
};

export type Position = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY';

export interface MatchUp {
  championId: number;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
}

export interface LolMatch {
  id: string;
  championId: number;
  championName: string;
  individualPosition: string;
  kills: number;
  deaths: number;
  assists: number;
  wardsPlaced: number;
  visionWardsBoughtInGame: number;
  totalTimeSpentDead: number;
  gameDuration: number;
  gameFinishedCorrectly: boolean;
  win: boolean;
  matchUp?: MatchUp | null;
}

export interface League {
  tier: string;
  rank: string;
  leaguePoints: number;
  gamesPlayed: number;
  winrate: number;
  teamPosition: string;
  matches: LolMatch[];
}

export interface LolPlayer {
  type: 'lol';
  summonerIcon: number;
  summonerLevel: number;
  summonerName: string;
  summonerTag: string;
  leagues: Partial<Record<(typeof QUEUE_KEYS)[Queue], League>>;
}
