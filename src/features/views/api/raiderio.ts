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
  keystone_run_id: number;
  dungeon: string;
  short_name: string;
  mythic_level: number;
  num_keystone_upgrades: number;
  completed_at: string;
  clear_time_ms: number;
  par_time_ms: number;
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

export { formatClearTime, formatDate } from "@/features/views/utils.ts";

export interface RaiderioProfile {
  id: number;
  name: string;
  realm: string;
  region: string;
  score: number;
  class: string;
  spec: string;
  quantile: number;
  mythicPlusRanks: MythicPlusRanks;
  mythicPlusBestRuns: MythicPlusBestRun[];
  mythicPlusRecentRuns: MythicPlusRecentRun[];
}

export interface ViewData {
  data: RaiderioProfile[];
  viewName: string;
}

export interface Dungeon {
  name: string;
  short_name: string;
  challenge_mode_id: number;
}

export interface Season {
  is_main_season: boolean;
  slug: string;
  name: string;
  blizzard_season_id: number;
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
  short_name: string;
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
  character_id: number;
  approximate_died_at: number;
  logged_encounter_id?: number;
}

export interface RunDetails {
  roster: RunDetailsRosterEntry[];
  logged_details?: {
    deaths?: RunDetailsDeath[];
  };
}

export interface MythicPlusBestRun {
  run: MythicPlusRun;
  details: RunDetails | null;
}
