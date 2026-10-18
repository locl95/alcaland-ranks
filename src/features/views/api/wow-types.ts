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

export { formatClearTime, formatDate } from '@/features/views/utils.ts';

export interface WowProfile {
  id: number;
  name: string;
  realm: string;
  region: string;
  score: number | null;
  class: string;
  spec: string;
  quantile: number;
  mythicPlusRanks: MythicPlusRanks;
  mythicPlusBestRuns: MythicPlusBestRun[];
  mythicPlusRecentRuns: MythicPlusRecentRun[];
}

export interface ViewData {
  data: WowProfile[];
  viewName: string;
}

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

export interface RunDetailsCharacterClass {
  name: string;
}

export interface RunDetailsCharacterSpec {
  name: string;
}

export interface RunDetailsCharacterRealm {
  id: number;
  name: string;
  slug: string;
}

export interface RunDetailsCharacterRegion {
  name: string;
  shortName: string;
  slug: string;
}

export interface RunDetailsCharacter {
  name: string;
  class: RunDetailsCharacterClass;
  spec: RunDetailsCharacterSpec;
  realm: RunDetailsCharacterRealm;
  region: RunDetailsCharacterRegion;
}

export interface RunDetailsRosterRanks {
  score: number;
}

export interface RunDetailsRosterEntry {
  character: RunDetailsCharacter;
  role: string;
  ranks: RunDetailsRosterRanks;
}

export interface RunDetailsDeath {
  approximateDiedAt: number;
}

export interface RunDetails {
  roster: RunDetailsRosterEntry[];
  loggedDetails?: {
    deaths?: RunDetailsDeath[];
  };
}

export interface MythicPlusBestRun {
  run: MythicPlusRun;
  details: RunDetails | null;
}
