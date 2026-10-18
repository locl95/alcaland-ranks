import './dungeon-grid.css';
import { memo, useMemo } from 'react';
import { MythicPlusRun, WowProfile, Season } from '@/features/views/api/wow-types.ts';
import { CharacterDungeonScore, DungeonCard } from './dungeon-card.tsx';

interface DungeonGridProps {
  profiles: WowProfile[];
  cachedProfiles: WowProfile[];
  season: Season;
}

function getCharacterScoresForDungeon(
  profiles: WowProfile[],
  dungeonId: string,
): CharacterDungeonScore[] {
  return profiles
    .map((character) => ({
      character,
      bestRun: character.mythicPlusBestRuns.find((br) => br.run.shortName === dungeonId),
    }))
    .sort((a, b) => {
      const scoreDiff = (b.bestRun?.run.score ?? 0) - (a.bestRun?.run.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (a.bestRun?.run.clearTimeMs ?? Infinity) - (b.bestRun?.run.clearTimeMs ?? Infinity);
    });
}

function getWinningRun(scores: CharacterDungeonScore[]): MythicPlusRun | undefined {
  return scores.find((s) => s.bestRun)?.bestRun?.run;
}

export const DungeonGrid = memo(function DungeonGrid({
  profiles,
  cachedProfiles,
  season,
}: Readonly<DungeonGridProps>) {
  const dungeonData = useMemo(
    () =>
      season.dungeons.map((dungeon) => {
        const characterScores = getCharacterScoresForDungeon(profiles, dungeon.shortName);
        return { dungeon, characterScores, winningRun: getWinningRun(characterScores) };
      }),
    [profiles, season.dungeons],
  );

  return (
    <div className="dungeon-grid">
      {dungeonData.map(({ dungeon, characterScores, winningRun }) => (
        <DungeonCard
          key={dungeon.dungeonId}
          dungeon={dungeon}
          characterScores={characterScores}
          winningRun={winningRun}
          cachedProfiles={cachedProfiles}
        />
      ))}
    </div>
  );
});
