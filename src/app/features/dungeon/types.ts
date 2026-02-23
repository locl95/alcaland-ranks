import {MythicPlusRun, RaiderioProfile} from "../../utils/raiderio";
import {differenceOrUndefined} from "../../utils/utils";

export interface GamerDungeon {
    name: string
    keyLevel: string
    keyUrl: string
    score: number
    scoreDifference?: number
}

export function gamerDungeonFromRaiderioProfile(raiderioProfile: RaiderioProfile, dungeon: string, cachedProfile?: RaiderioProfile): GamerDungeon {

    function numberToPlusString(n: number) {
        return Array.from(Array(n).keys()).map(x => "+").toString().replaceAll(",", "")
    }

    const bestDungeon: MythicPlusRun | undefined = raiderioProfile.mythicPlusBestRuns.find(mpr => mpr.short_name === dungeon)
    const score = (bestDungeon?.score ?? 0)
    const bestCachedDungeon: MythicPlusRun | undefined = cachedProfile?.mythicPlusBestRuns.find(mpr => mpr.short_name === dungeon)
    const cachedScore = (bestCachedDungeon?.score ?? 0)

    return {
        name: raiderioProfile.name,
        keyLevel: (bestDungeon?.mythic_level.toString() ?? "") + numberToPlusString(bestDungeon?.num_keystone_upgrades ?? 0),
        keyUrl: bestDungeon?.url ?? "",
        score: Number(score.toFixed(1)),
        scoreDifference: differenceOrUndefined(score, cachedScore)
    }
}
