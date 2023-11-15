import {MythicPlusRankWithSpec, RaiderioProfile} from "../../utils/raiderio";
import {differenceOrUndefined} from "../../utils/utils";

export interface GamerRankSpec {
    name: string
    spec: string
    score: number
    world: number
    worldDifference?: number
    region: number
    regionDifference?: number
    realm: number
    realmDifference?: number
}

export function gamerRankSpecsFromRaiderioProfile(raiderIoProfile: RaiderioProfile, mythicPlusRank: MythicPlusRankWithSpec, cachedMythicPlusRankWithSpec?: MythicPlusRankWithSpec): GamerRankSpec {

    return {
        name: raiderIoProfile.name,
        score: mythicPlusRank.score,
        spec: mythicPlusRank.name,
        world: mythicPlusRank.world,
        worldDifference: differenceOrUndefined(mythicPlusRank.world, cachedMythicPlusRankWithSpec?.world),
        region: mythicPlusRank.region,
        regionDifference: differenceOrUndefined(mythicPlusRank.region, cachedMythicPlusRankWithSpec?.region),
        realm: mythicPlusRank.realm,
        realmDifference: differenceOrUndefined(mythicPlusRank.realm, cachedMythicPlusRankWithSpec?.realm)
    }
}
