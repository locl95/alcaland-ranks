import {RaiderioProfile} from "../../utils/raiderio";

export interface Gamer {
    name: string
    class: string
    spec: string
    score: number
    cachedScore?: number
    quantile: number
    cachedQuantile?: number
}

export function gamerFromRaiderioProfile(raiderioProfile: RaiderioProfile, cachedProfile?: RaiderioProfile): Gamer {

    return {
        name: raiderioProfile.name,
        class: raiderioProfile.class,
        spec: raiderioProfile.spec,
        score:  raiderioProfile.score,
        cachedScore: cachedProfile?.score,
        quantile: raiderioProfile.quantile,
        cachedQuantile: cachedProfile?.quantile
    }
}
