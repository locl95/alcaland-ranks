import {RaiderioProfile} from "../../utils/raiderio";
import {differenceOrUndefined} from "../../utils/utils";

export interface Gamer {
    name: string
    class: string
    spec: string
    score: number
    scoreDifference?: number
    quantile: number
    quantileDifference?: number
}

export function gamerFromRaiderioProfile(raiderioProfile: RaiderioProfile, cachedProfile?: RaiderioProfile): Gamer {

    return {
        name: raiderioProfile.name,
        class: raiderioProfile.class,
        spec: raiderioProfile.spec,
        score: raiderioProfile.score,
        scoreDifference: differenceOrUndefined(raiderioProfile.score, cachedProfile?.score),
        quantile: raiderioProfile.quantile,
        quantileDifference: differenceOrUndefined(raiderioProfile.quantile, cachedProfile?.quantile)
    }
}
