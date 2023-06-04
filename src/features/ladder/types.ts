import {RaiderioProfile} from "../../utils/raiderio";

export interface Gamer {
  name: string
  class: string
  spec: string
  score: number
}

export function gamerFromRaiderioProfile(raiderioProfile: RaiderioProfile): Gamer {
  return {
    name: raiderioProfile.name,
    class: raiderioProfile.class,
    spec: raiderioProfile.active_spec_name,
    score: raiderioProfile.mythic_plus_scores_by_season.find(mps => mps.season === "season-df-2")!.scores.all
  }
}
