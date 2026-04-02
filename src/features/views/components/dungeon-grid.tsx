import { useState } from "react";
import { Crown, Skull, Loader2 } from "lucide-react";
import "@/styles/features/views/dungeon-grid.css";
import {
  MythicPlusRun,
  RaiderioProfile,
  RunDetailsResponse,
  Season,
  formatClearTime,
  formatDate,
} from "@/features/views/api/Raiderio.tsx";
import { fetchWithResponse } from "@/shared/api/EasyFetch.ts";

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

const ROLE_ORDER: Record<string, number> = { tank: 0, healer: 1, dps: 2 };

const CLASS_COLORS: Record<string, string> = {
  "Warrior":      "#d97706",
  "Paladin":      "#ec4899",
  "Hunter":       "#65a30d",
  "Rogue":        "#facc15",
  "Priest":       "#f1f5f9",
  "Death Knight": "#b91c1c",
  "Shaman":       "#3b82f6",
  "Mage":         "#22d3ee",
  "Warlock":      "#9333ea",
  "Monk":         "#10b981",
  "Druid":        "#f97316",
  "Demon Hunter": "#7c3aed",
  "Evoker":       "#14b8a6",
};

const getScoreClass = (score: number): string => {
  if (score < 300)  return "score-grey";
  if (score < 1100) return "score-green";
  if (score < 1800) return "score-blue";
  if (score < 3000) return "score-purple";
  return "score-orange";
};

export function DungeonGrid({
  raiderioProfiles,
  raiderioCachedProfiles,
  season,
}: Readonly<DungeonGridProps>) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [runDetailsCache, setRunDetailsCache] = useState<Record<number, RunDetailsResponse>>({});
  const [loadingRunIds, setLoadingRunIds] = useState<Set<number>>(new Set());

  const handleRunClick = async (characterId: number, run: MythicPlusRun) => {
    const runId = run.keystone_run_id;
    const expandKey = `${characterId}-${runId}`;

    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(expandKey)) {
        next.delete(expandKey);
      } else {
        next.add(expandKey);
      }
      return next;
    });

    if (runDetailsCache[runId] !== undefined || loadingRunIds.has(runId)) return;

    setLoadingRunIds((prev) => new Set(prev).add(runId));
    try {
      const details = await fetchWithResponse<RunDetailsResponse>(
        "GET",
        `/sources/wow/rundetails?runId=${runId}`,
        undefined,
        `Bearer ${import.meta.env.VITE_SERVICE_TOKEN}`,
      );
      setRunDetailsCache((prev) => ({ ...prev, [runId]: details }));
    } catch (error) {
      console.error("Failed to fetch run details", error);
      setExpandedKeys((prev) => {
        const next = new Set(prev);
        next.delete(expandKey);
        return next;
      });
    } finally {
      setLoadingRunIds((prev) => {
        const next = new Set(prev);
        next.delete(runId);
        return next;
      });
    }
  };

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
      .sort((a, b) => {
        const scoreDiff = (b.run?.score ?? 0) - (a.run?.score ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (a.run?.clear_time_ms ?? Infinity) - (b.run?.clear_time_ms ?? Infinity);
      });
  };

  const getWinningRun = (scores: CharacterDungeonScore[]): MythicPlusRun | undefined => {
    return scores.find((s) => s.run)?.run;
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

  return (
    <div className="dungeon-grid">
      {season.dungeons.map((dungeon) => {
        const characterScores = getCharacterScoresForDungeon(
          dungeon.short_name,
        );
        const winningRun = getWinningRun(characterScores);

        return (
          <div key={dungeon.challenge_mode_id} className="dungeon-card">
            <div className="dungeon-header">
              <div className="dungeon-title">{dungeon.name}</div>
              <div className="dungeon-abbreviation">{dungeon.short_name}</div>
            </div>
            <div className="dungeon-content">
              {characterScores.map(({ character, run }) => {
                const isHighest =
                  !!winningRun &&
                  run?.score === winningRun.score &&
                  run?.clear_time_ms === winningRun.clear_time_ms;
                const scoreImprovement = run
                  ? getScoreImprovement(character, run)
                  : 0;
                const expandKey = run ? `${character.id}-${run.keystone_run_id}` : "";
                const isExpanded = run ? expandedKeys.has(expandKey) : false;
                const isLoadingDetails = isExpanded && !!run && loadingRunIds.has(run.keystone_run_id);
                const details = run ? runDetailsCache[run.keystone_run_id] : undefined;

                return (
                  <div key={character.id} className="character-run-wrapper">
                    <div
                      className={`character-run ${isHighest ? "highest" : "normal"} ${isExpanded ? "expanded" : ""}`}
                      onClick={() => run && handleRunClick(character.id, run)}
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
                              <>
                                <p className={`character-run-level ${className}`}>
                                  {prefix}
                                  {run.mythic_level}
                                </p>
                                <p className="character-run-class">
                                  {formatClearTime(run.clear_time_ms)}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="character-run-no-data">
                          <p>No run</p>
                        </div>
                      )}
                    </div>

                    {run && isExpanded && (
                      <div className="run-details-panel">
                        {isLoadingDetails ? (
                          <div className="run-details-spinner">
                            <Loader2 className="run-details-spinner-icon" />
                          </div>
                        ) : details ? (
                          <>
                            <div className="run-details-top">
                              <span className="run-details-deaths">
                                <Skull className="skull-icon" />
                                x {details.deathCount}
                              </span>
                            </div>
                            <div className="run-details-roster">
                              {[...details.roster]
                                .sort((a, b) => (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99))
                                .map((entry) => (
                                  <div
                                    key={`${entry.character.name}-${entry.character.realm.slug}`}
                                    className="run-details-row"
                                  >
                                    <div className="run-details-character-info">
                                      <span className="run-details-name">
                                        {entry.character.name}
                                        {" · "}
                                        <span style={{ color: CLASS_COLORS[entry.character.class.name] ?? "#94a3b8" }}>
                                          {entry.character.spec.name}
                                        </span>
                                      </span>
                                      <span className="run-details-realm">
                                        {entry.character.realm.name}
                                      </span>
                                    </div>
                                    <span className={`run-details-score ${getScoreClass(entry.ranks.score)}`}>
                                      {Math.round(entry.ranks.score)}
                                    </span>
                                  </div>
                                ))}
                            </div>
                            <div className="run-details-footer">
                              <span className="run-details-date">{formatDate(run.completed_at)}</span>
                            </div>
                          </>
                        ) : null}
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
