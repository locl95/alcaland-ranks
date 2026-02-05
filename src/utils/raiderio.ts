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
}

export interface ViewData {
    data: RaiderioProfile[]
    viewName: string
}
/*
{
    "is_main_season": true,
    "name": "MN Season 1",
    "blizzard_season_id": 16,
    "dungeons": [
        {
            "name": "Algeth'ar Academy",
            "short_name": "AA",
            "challenge_mode_id": 402
        },
        {
            "name": "Magisters' Terrace",
            "short_name": "MT",
            "challenge_mode_id": 558
        },
        {
            "name": "Maisara Caverns",
            "short_name": "MC",
            "challenge_mode_id": 560
        },
        {
            "name": "Nexus-Point Xenas",
            "short_name": "NPX",
            "challenge_mode_id": 559
        },
        {
            "name": "Pit of Saron",
            "short_name": "POS",
            "challenge_mode_id": 556
        },
        {
            "name": "Seat of the Triumvirate",
            "short_name": "SEAT",
            "challenge_mode_id": 239
        },
        {
            "name": "Skyreach",
            "short_name": "SR",
            "challenge_mode_id": 161
        },
        {
            "name": "Windrunner Spire",
            "short_name": "WS",
            "challenge_mode_id": 557
        }
    ]
}
*/

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