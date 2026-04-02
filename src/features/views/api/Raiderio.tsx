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
  score: number;
  url: string;
  affixes: Affix[];
}

export function formatClearTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

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
  mythicPlusBestRuns: MythicPlusRun[];
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
  world: number;
  region: number;
  realm: number;
}

export interface RunDetailsRosterEntry {
  character: RunDetailsCharacter;
  role: string;
  ranks: RunDetailsRosterRanks;
}

export interface RunDetailsResponse {
  roster: RunDetailsRosterEntry[];
  deathCount: number;
}
