interface MythicPlusScores {
    all: number
    dps: number
    haler: number
    tank: number
}

interface MythicPlusScoresBySeason {
    season: string
    scores: MythicPlusScores
}

interface MythicPlusRun {
    short_name: string
    mythic_level: number
    score: number
}

export interface Rank {
    world: number
    region: number
    realm: number
}

interface MythicPlusRanks {
    overall: Rank
}

export interface RaiderioProfile {
    name: string
    race: string
    class: string
    active_spec_name: string
    mythic_plus_scores_by_season: MythicPlusScoresBySeason[]
    mythic_plus_best_runs: MythicPlusRun[]
    mythic_plus_ranks: MythicPlusRanks
}

interface Quantile {
    totalPopulationCount: number
}

interface _Cutoff {
    all: Quantile
}
interface Cutoff {
    p999: _Cutoff
}

export interface RaiderioCutoff {
    cutoffs: Cutoff
}