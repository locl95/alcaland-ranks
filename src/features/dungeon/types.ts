import {RaiderioProfile} from "../../utils/raiderio";

export interface GamerDungeon {
  name: string
  level: number
  score: number
}

export function gamerDungeonFromRaiderioProfile(raiderioProfile: RaiderioProfile, dungeon: string): GamerDungeon {
  return {
    name: raiderioProfile.name,
    level: raiderioProfile.mythic_plus_best_runs.find(mpr => mpr.short_name === dungeon)!.mythic_level,
    score: raiderioProfile.mythic_plus_best_runs.find(mpr => mpr.short_name === dungeon)!.score
  }
}
