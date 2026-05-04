import "./dungeon-grid.css";
import { memo, useMemo } from "react";
import {
  MythicPlusRun,
  RaiderioProfile,
  Season,
} from "@/features/views/api/raiderio.ts";
import { CharacterDungeonScore, DungeonCard } from "./dungeon-card.tsx";

interface DungeonGridProps {
  raiderioProfiles: RaiderioProfile[];
  raiderioCachedProfiles: RaiderioProfile[];
  season: Season;
}

function getCharacterScoresForDungeon(
  profiles: RaiderioProfile[],
  dungeonId: string,
): CharacterDungeonScore[] {
  return profiles
    .map((character) => ({
      character,
      bestRun: character.mythicPlusBestRuns.find(
        (br) => br.run.short_name === dungeonId,
      ),
    }))
    .sort((a, b) => {
      const scoreDiff =
        (b.bestRun?.run.score ?? 0) - (a.bestRun?.run.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (
        (a.bestRun?.run.clear_time_ms ?? Infinity) -
        (b.bestRun?.run.clear_time_ms ?? Infinity)
      );
    });
}

function getWinningRun(
  scores: CharacterDungeonScore[],
): MythicPlusRun | undefined {
  return scores.find((s) => s.bestRun)?.bestRun?.run;
}

export const DungeonGrid = memo(function DungeonGrid({
  raiderioProfiles,
  raiderioCachedProfiles,
  season,
}: Readonly<DungeonGridProps>) {
  const dungeonData = useMemo(
    () =>
      season.dungeons.map((dungeon) => {
        const characterScores = getCharacterScoresForDungeon(
          raiderioProfiles,
          dungeon.short_name,
        );
        return { dungeon, characterScores, winningRun: getWinningRun(characterScores) };
      }),
    [raiderioProfiles, season.dungeons],
  );

  return (
    <div className="dungeon-grid">
      {dungeonData.map(({ dungeon, characterScores, winningRun }) => (
        <DungeonCard
          key={dungeon.challenge_mode_id}
          dungeon={dungeon}
          characterScores={characterScores}
          winningRun={winningRun}
          cachedProfiles={raiderioCachedProfiles}
        />
      ))}
    </div>
  );
});
