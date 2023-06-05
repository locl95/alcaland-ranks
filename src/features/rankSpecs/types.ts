import {RaiderioProfile, Rank} from "../../utils/raiderio";
import {specs} from "../../utils/utils";

export interface GamerRankSpec {
  name: string
  spec: string
  world: number
  region: number
  realm: number
}

export function gamerRankSpecsFromRaiderioProfile(raiderIoProfile: RaiderioProfile, spec: number): GamerRankSpec {
  const json: Map<string, Object> = new Map(Object.entries(JSON.parse(JSON.stringify(raiderIoProfile.mythic_plus_ranks))))
  console.log(json)
  const rank: Rank = json.get("spec_"+spec.toString())! as Rank

  return {
    name: raiderIoProfile.name,
    spec: specs.get(spec)!,
    world: rank.world,
    region: rank.region,
    realm:rank.realm
  }
}
