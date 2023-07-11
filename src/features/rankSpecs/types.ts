import {MythicPlusScores, RaiderioProfile, Rank} from "../../utils/raiderio";
import {Spec} from "../../utils/utils";

export interface GamerRankSpec {
  name: string
  spec: string
  score: number
  world: number
  region: number
  realm: number
}

function specScoreFromInnerSpec(innerSpec: number, scores: MythicPlusScores): number {
  switch (innerSpec) {
    case 0: return scores.spec_0
    case 1: return scores.spec_1
    case 2: return scores.spec_2
    case 3: return scores.spec_3
    default: return 0
  }
}

export function gamerRankSpecsFromRaiderioProfile(raiderIoProfile: RaiderioProfile, spec: Spec): GamerRankSpec {
  const json: Map<string, Object> = new Map(Object.entries(JSON.parse(JSON.stringify(raiderIoProfile.mythic_plus_ranks))))
  console.log(json)
  const rank: Rank = json.get("spec_"+spec.externalSpec.toString())! as Rank
  const scores = raiderIoProfile.mythic_plus_scores_by_season.find(mps => mps.season === "season-df-2")!.scores

  return {
    name: raiderIoProfile.name,
    score: specScoreFromInnerSpec(spec.internalSpec, scores),
    spec: spec.name,
    world: rank.world,
    region: rank.region,
    realm:rank.realm
  }
}
