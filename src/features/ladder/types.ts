import {RaiderioCutoff, RaiderioProfile} from "../../utils/raiderio";

export interface Gamer {
    name: string
    class: string
    spec: string
    score: number
    quantile: number
}

function calculateQuantile(raiderioCutoff: RaiderioCutoff, raiderioProfile: RaiderioProfile): number {
    return raiderioProfile.mythic_plus_ranks.overall.region / raiderioCutoff.cutoffs.p999.all.totalPopulationCount * 100
}

export function gamerFromRaiderioProfile(raiderioProfile: RaiderioProfile, cutoffs: RaiderioCutoff): Gamer {
    const score = raiderioProfile.mythic_plus_scores_by_season.find(mps => mps.season === "season-df-2")!.scores.all
    return {
        name: raiderioProfile.name,
        class: raiderioProfile.class,
        spec: raiderioProfile.active_spec_name,
        score: score,
        quantile: Number(calculateQuantile(cutoffs,raiderioProfile).toFixed(2))
    }
}
