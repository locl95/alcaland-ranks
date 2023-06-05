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
    world: raiderioProfile.mythic_plus_ranks.overall.world,
    region: raiderioProfile.mythic_plus_ranks.overall.region,
    realm: raiderioProfile.mythic_plus_ranks.overall.realm
  }
}
