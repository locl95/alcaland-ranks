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
/*
{
    class: "Priest",
    specs: [256, 257, 258]
  },
  {
    class: "Paladin",
    specs: [65, 66, 70]
  },
  {
    class: "Rogue",
    specs: [259, 260, 261]
  },
  {
    class: "Druid",
    specs: [102, 103, 104,105]
  },
  {
    class: "Monk",
    specs: [268, 269, 270]
  },
  {
    class: "Evoker",
    specs: [1467, 1468, 1473]
  },
 */
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