import {RaiderioProfile} from "../../utils/raiderio";
import {differenceOrUndefined} from "../../utils/utils";

export interface GamerRank {
  name: string
  world: number
  worldDifference?: number
  region: number
  regionDifference?: number
  realm: number
  realmDifference?: number
}

export function gamerRankFromRaiderioProfile(raiderioProfile: RaiderioProfile, cachedProfile?: RaiderioProfile): GamerRank {

  return {
    name: raiderioProfile.name,
    world: raiderioProfile.mythicPlusRanks.overall.world,
    worldDifference: differenceOrUndefined(raiderioProfile.mythicPlusRanks.overall.world, cachedProfile?.mythicPlusRanks.overall.world),
    region: raiderioProfile.mythicPlusRanks.overall.region,
    regionDifference: differenceOrUndefined(raiderioProfile.mythicPlusRanks.overall.region, cachedProfile?.mythicPlusRanks.overall.region),
    realm: raiderioProfile.mythicPlusRanks.overall.realm,
    realmDifference: differenceOrUndefined(raiderioProfile.mythicPlusRanks.overall.realm, cachedProfile?.mythicPlusRanks.overall.realm)
  }
}
