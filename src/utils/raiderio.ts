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
    short_name: string //camelCase
    mythic_level: number //camelCase
    num_keystone_upgrades: number //camelCase
    score: number
    url: string
    affixes: Affix[]
}

export interface RaiderioProfile {
    id: number,
    name: string
    score: number
    class: string
    spec: string
    quantile: number
    mythicPlusRanks: MythicPlusRanks
    mythicPlusBestRuns: MythicPlusRun[]
    mythicPlusAlternateRuns: MythicPlusRun[]
}