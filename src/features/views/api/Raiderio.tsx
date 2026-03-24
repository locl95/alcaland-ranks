interface Affix {
    name: string
}

interface MythicPlusRank {
    world: number
    region: number
    realm: number
}

export interface MythicPlusRankWithSpec extends MythicPlusRank {
    name: string
    score: number
}

interface MythicPlusRanks {
    overall: MythicPlusRank
    class: MythicPlusRank
    specs: MythicPlusRankWithSpec[]
}

export interface MythicPlusRun {
    dungeon: string
    short_name: string
    mythic_level: number
    num_keystone_upgrades: number
    score: number
    url: string
    affixes: Affix[]
}

export interface RaiderioProfile {
    id: number
    name: string
    realm: string
    region: string
    score: number
    class: string
    spec: string
    quantile: number
    mythicPlusRanks: MythicPlusRanks
    mythicPlusBestRuns: MythicPlusRun[]
}

export interface ViewData {
    data: RaiderioProfile[]
    viewName: string
}

export interface Dungeon {
    name: string,
    short_name: string,
    challenge_mode_id: number
}

export interface Season {
    is_main_season: boolean,
    name: string,
    blizzard_season_id: number,
    dungeons: Dungeon[]
}