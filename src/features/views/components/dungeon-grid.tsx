import { Crown } from "lucide-react";
import "@/styles/features/views/dungeon-grid.css";
import {
  MythicPlusRun,
  RaiderioProfile,
  Season,
} from "@/features/views/api/Raiderio.tsx";

interface DungeonGridProps {
  raiderioProfiles: RaiderioProfile[];
  raiderioCachedProfiles: RaiderioProfile[];
  season: Season;
}

interface CharacterDungeonScore {
  character: RaiderioProfile;
  run: MythicPlusRun | undefined;
}

const KEYSTONE_DISPLAY: Record<number, { prefix: string; className: string }> =
  {
    0: { prefix: "", className: "keystone-depleted" },
    1: { prefix: "+", className: "keystone-1" },
    2: { prefix: "++", className: "keystone-2" },
    3: { prefix: "+++", className: "keystone-3" },
  };

export function DungeonGrid({
  raiderioProfiles,
  raiderioCachedProfiles,
  season,
}: DungeonGridProps) {
  const getCharacterScoresForDungeon = (
    dungeonId: string,
  ): CharacterDungeonScore[] => {
    return raiderioProfiles
      .map((character) => ({
        character,
        run: character.mythicPlusBestRuns.find(
          (run) => run.short_name === dungeonId,
        ),
      }))
      .sort((a, b) => (b.run?.score ?? 0) - (a.run?.score ?? 0));
  };

  const getHighestScore = (scores: CharacterDungeonScore[]): number => {
    return Math.max(...scores.map((s) => s.run?.score || 0));
  };

  const getCachedRaiderIoProfile = (
    raiderioCachedProfiles: RaiderioProfile[],
    character: RaiderioProfile,
  ): RaiderioProfile | undefined => {
    return raiderioCachedProfiles.find(
      (cachedProfile) => cachedProfile.id == character.id,
    );
  };

  const getKeystoneDisplay = (upgrades: number) => KEYSTONE_DISPLAY[upgrades];

  const getScoreImprovement = (
    raiderioProfile: RaiderioProfile,
    currentRun: MythicPlusRun,
  ): number => {
    const cachedRun = getCachedRaiderIoProfile(
      raiderioCachedProfiles,
      raiderioProfile,
    )?.mythicPlusBestRuns.find(
      (run) => run.short_name === currentRun.short_name,
    );

    if (!cachedRun) {
      return 0;
    }

    return currentRun.score - cachedRun.score;
  };

  {
    /* Dungeon Grid */
  }
  return (
    <div className="dungeon-grid">
      {season.dungeons.map((dungeon) => {
        const characterScores = getCharacterScoresForDungeon(
          dungeon.short_name,
        );
        const highestScore = getHighestScore(characterScores);

        return (
          <div key={dungeon.challenge_mode_id} className="dungeon-card">
            <div className="dungeon-header">
              <div className="dungeon-title">{dungeon.name}</div>
              <div className="dungeon-abbreviation">{dungeon.short_name}</div>
            </div>
            <div className="dungeon-content">
              {characterScores.map(({ character, run }) => {
                const isHighest =
                  run?.score === highestScore && highestScore > 0;
                const scoreImprovement = run
                  ? getScoreImprovement(character, run)
                  : 0;

                return (
                  <div
                    key={character.id}
                    className={`character-run ${isHighest ? "highest" : "normal"}`}
                  >
                    <div className="character-run-left">
                      {isHighest && <Crown className="crown-icon" />}
                      <div className="character-run-info">
                        <p
                          className={`character-run-name ${isHighest ? "highest" : "normal"}`}
                        >
                          {character.name}
                        </p>
                        <p className="character-run-class">{character.spec}</p>
                      </div>
                    </div>

                    {run ? (
                      <div className="character-run-stats">
                        <div className="character-run-score-row">
                          <p
                            className={`character-run-score ${isHighest ? "highest" : "normal"}`}
                          >
                            {Math.round(run.score)}
                          </p>
                          {scoreImprovement > 0 && (
                            <span className="score-improvement">
                              +{Math.round(scoreImprovement)}
                            </span>
                          )}
                        </div>
                        {(() => {
                          const { prefix, className } = getKeystoneDisplay(
                            run.num_keystone_upgrades,
                          );
                          return (
                            <p className={`character-run-level ${className}`}>
                              {prefix}
                              {run.mythic_level}
                            </p>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="character-run-no-data">
                        <p>No run</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
