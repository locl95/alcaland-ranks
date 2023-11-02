import {RaiderioProfile} from "../../utils/raiderio";

export interface GamerRank {
  name: string
  world: number
  region: number
  realm: number
}

export function gamerRankFromRaiderioProfile(raiderioProfile: RaiderioProfile): GamerRank {
  return {
    name: raiderioProfile.name,
    world: raiderioProfile.mythicPlusRanks.overall.world,
    region: raiderioProfile.mythicPlusRanks.overall.region,
    realm: raiderioProfile.mythicPlusRanks.overall.realm
  }
}
