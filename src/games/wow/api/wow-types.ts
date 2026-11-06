import { ViewDataResponse } from '@/features/views/api/view-types.ts';

interface Affix {
  name: string;
}

interface MythicPlusRank {
  world: number;
  region: number;
  realm: number;
}

export interface MythicPlusRankWithSpec extends MythicPlusRank {
  name: string;
  score: number;
}

interface MythicPlusRanks {
  overall: MythicPlusRank;
  class: MythicPlusRank;
  specs: MythicPlusRankWithSpec[];
}

export interface MythicPlusRun {
  runId: number;
  dungeon: string;
  shortName: string;
  keyLevel: number;
  upgrades: number;
  dateCompleted: string;
  clearTimeMs: number;
  dungeonTimeMs: number;
  score: number;
  url: string;
  affixes: Affix[];
  spec?: RecentRunSpec;
}

export interface RecentRunSpec {
  id: number;
  name: string;
  role: string;
}

export interface MythicPlusRecentRun extends MythicPlusRun {
  spec: RecentRunSpec;
}

export { formatClearTime, formatDate } from '@/games/wow/utils.ts';

export interface WowProfile {
  id: number;
  name: string;
  realm: string;
  region: string;
  score: number | null;
  class: string;
  spec: string;
  quantile: number;
  race: string;
  faction: string;
  equippedItemLevel: number;
  guild?: string;
  mythicPlusRanks: MythicPlusRanks;
  mythicPlusBestRuns: MythicPlusBestRun[];
  mythicPlusRecentRuns: MythicPlusRecentRun[];
}

export type ViewData = ViewDataResponse<WowProfile>;

export interface Dungeon {
  name: string;
  shortName: string;
  dungeonId: number;
  icon: string;
}

export interface Season {
  isCurrentSeason: boolean;
  slug: string;
  name: string;
  blizzardSeasonId: number;
  dungeons: Dungeon[];
}

export interface RunDetailsMember {
  name: string;
  realm: string;
  class: string;
  spec: RecentRunSpec;
  race: string;
  itemLevel: number;
}

export interface RunDetails {
  members: RunDetailsMember[];
}

export interface MythicPlusBestRun {
  run: MythicPlusRun;
  details: RunDetails | null;
}
