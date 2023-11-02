import {RaiderioProfile} from "../../utils/raiderio";

export interface Gamer {
    name: string
    class: string
    spec: string
    score: number
    quantile: number
}

export function gamerFromRaiderioProfile(raiderioProfile: RaiderioProfile): Gamer {
    return {
        name: raiderioProfile.name,
        class: raiderioProfile.class,
        spec: raiderioProfile.spec,
        score:  raiderioProfile.score,
        quantile: raiderioProfile.quantile
    }
}
