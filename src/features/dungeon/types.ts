import {MythicPlusRun, RaiderioProfile} from "../../utils/raiderio";

export interface GamerDungeon {
  name: string
  tyrannicalLevel: string
  tyrannicalUrl: string
  fortifiedLevel: string
  fortifiedUrl: string
  score: number
}

export function gamerDungeonFromRaiderioProfile(raiderioProfile: RaiderioProfile, dungeon: string): GamerDungeon {

  function numberToPlusString(n: number) {
    return Array.from(Array(n).keys()).map(x => "+").toString().replaceAll(",","")
  }

  const bestDungeon: MythicPlusRun | undefined = raiderioProfile.mythicPlusBestRuns.find(mpr => mpr.short_name === dungeon)
  const bestAlternateDungeon: MythicPlusRun | undefined = raiderioProfile.mythicPlusAlternateRuns.find(mpr => mpr.short_name === dungeon)

  const bestTyrannicalDungeon = bestDungeon?.affixes.some(a => a.name === "Tyrannical") ? bestDungeon : bestAlternateDungeon
  const bestFortifiedDungeon = bestDungeon?.affixes.some(a => a.name === "Fortified") ? bestDungeon : bestAlternateDungeon

  return {
    name: raiderioProfile.name,
    tyrannicalLevel: (bestTyrannicalDungeon?.mythic_level.toString() ?? "") + numberToPlusString(bestTyrannicalDungeon?.num_keystone_upgrades ?? 0),
    tyrannicalUrl: bestTyrannicalDungeon?.url ?? "",
    fortifiedLevel: (bestFortifiedDungeon?.mythic_level.toString() ?? "") +  numberToPlusString(bestFortifiedDungeon?.num_keystone_upgrades ?? 0),
    fortifiedUrl: bestFortifiedDungeon?.url ?? "",
    score: Number(((bestDungeon?.score ?? 0) * 1.5
        +  (bestAlternateDungeon?.score ?? 0) * 0.5).toFixed(1)),
  }
}
