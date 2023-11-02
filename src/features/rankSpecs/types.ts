import {MythicPlusRankWithSpec, RaiderioProfile} from "../../utils/raiderio";

export interface GamerRankSpec {
  name: string
  spec: string
  score: number
  world: number
  region: number
  realm: number
}

export function gamerRankSpecsFromRaiderioProfile(raiderIoProfile: RaiderioProfile, mythicPlusRank: MythicPlusRankWithSpec): GamerRankSpec {

  return {
    name: raiderIoProfile.name,
    score: mythicPlusRank.score,
    spec: mythicPlusRank.name,
    world: mythicPlusRank.world,
    region: mythicPlusRank.region,
    realm: mythicPlusRank.realm
  }
}
