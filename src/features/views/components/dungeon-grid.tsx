import {
  MythicPlusRun,
  RaiderioProfile,
  Season,
} from "@/app/utils/raiderio.ts";
import { Crown } from "lucide-react";
import "./dungeon-grid.css";

interface DungeonGridProps {
  raiderioProfiles: RaiderioProfile[];
  raiderioCachedProfiles: RaiderioProfile[];
  season: Season;
}

interface CharacterDungeonScore {
  character: RaiderioProfile;
  run: MythicPlusRun | undefined;
}

export function DungeonGrid({
  raiderioProfiles,
  raiderioCachedProfiles,
  season,
}: DungeonGridProps) {
  const getCharacterScoresForDungeon = (
    dungeonId: string,
  ): CharacterDungeonScore[] => {
    return raiderioProfiles.map((character) => ({
      character,
      run: character.mythicPlusBestRuns.find(
        (run) => run.short_name === dungeonId,
      ),
    }));
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
                        <p className="character-run-class">
                          {character.class} - {character.spec}
                        </p>
                      </div>
                    </div>

                    {run ? (
                      <div className="character-run-stats">
                        <div className="character-run-score-row">
                          <p
                            className={`character-run-score ${isHighest ? "highest" : "normal"}`}
                          >
                            {run.score}
                          </p>
                          {scoreImprovement > 0 && (
                            <span className="score-improvement">
                              +{scoreImprovement}
                            </span>
                          )}
                        </div>
                        <p className="character-run-level">
                          +{run.mythic_level}
                        </p>
                        <p className="character-run-date">
                          {new Date().toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
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
