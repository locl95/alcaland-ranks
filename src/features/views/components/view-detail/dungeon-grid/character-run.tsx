import "./character-run.css";
import { useState } from "react";
import { Crown } from "lucide-react";
import { MythicPlusBestRun, RaiderioProfile, formatClearTime } from "@/features/views/api/raiderio.ts";
import { formatTimeDelta, getClassSlug } from "@/features/views/utils.ts";
import { KEYSTONE_DISPLAY } from "@/features/views/constants/keystone.ts";
import { CLASS_COLORS } from "@/features/views/constants/class-colors.ts";
import { SPEC_IMAGES, getSpecImageKey } from "@/features/views/constants/spec-images.ts";
import { RunDetailsPanel } from "./run-details-panel.tsx";

function getScoreImprovement(
  cached: RaiderioProfile[],
  character: RaiderioProfile,
  bestRun: MythicPlusBestRun,
): number {
  const cachedBestRun = cached
    .find((c) => c.id === character.id)
    ?.mythicPlusBestRuns.find((br) => br.run.short_name === bestRun.run.short_name);
  return cachedBestRun ? bestRun.run.score - cachedBestRun.run.score : 0;
}

interface CharacterRunProps {
  character: RaiderioProfile;
  bestRun: MythicPlusBestRun | undefined;
  isHighest: boolean;
  cachedProfiles: RaiderioProfile[];
}

export function CharacterRun({
  character,
  bestRun,
  isHighest,
  cachedProfiles,
}: Readonly<CharacterRunProps>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const run = bestRun?.run;
  const specName = run?.spec?.name ?? character.spec;
  const specImg = SPEC_IMAGES[getSpecImageKey(character.class, specName)];
  const scoreImprovement = bestRun ? getScoreImprovement(cachedProfiles, character, bestRun) : 0;
  const timeDelta = run ? formatTimeDelta(run.clear_time_ms, run.par_time_ms) : null;

  return (
    <div className="character-run-wrapper">
      <div
        className={`character-run ${isHighest ? "highest" : "normal"} ${isExpanded ? "expanded" : ""}`}
        onClick={() => run && setIsExpanded((prev) => !prev)}
      >
        <div className="character-run-left">
          {isHighest && <Crown className="crown-icon" />}
          <div className="character-run-info">
            <div className="character-run-name-row">
              {specImg && (
                <img src={specImg} alt={specName} title={specName} className="spec-icon" />
              )}
              <p
                className={`character-run-name ${isHighest ? "highest" : "normal"}`}
                style={{ color: CLASS_COLORS[getClassSlug(character.class)] ?? "#dde4ee" }}
              >
                {character.name}
              </p>
            </div>
          </div>
        </div>

        {run ? (
          <div className="character-run-stats">
            <div className="character-run-score-row">
              <p className={`character-run-score ${isHighest ? "highest" : "normal"}`}>
                {Math.round(run.score)}
              </p>
              {scoreImprovement > 0 && (
                <span className="score-improvement">+{Math.round(scoreImprovement)}</span>
              )}
            </div>
            <p className={`character-run-level ${KEYSTONE_DISPLAY[run.num_keystone_upgrades].className}`}>
              {KEYSTONE_DISPLAY[run.num_keystone_upgrades].prefix}{run.mythic_level}
            </p>
            <p className="character-run-class">
              {formatClearTime(run.clear_time_ms)}
              {" "}
              {timeDelta && (
                <span className={timeDelta.timed ? "time-delta-timed" : "time-delta-depleted"}>
                  ({timeDelta.text})
                </span>
              )}
            </p>
          </div>
        ) : (
          <div className="character-run-no-data">
            <p>No run</p>
          </div>
        )}
      </div>

      {run && isExpanded && (
        <RunDetailsPanel run={run} details={bestRun!.details} characterRegion={character.region} />
      )}
    </div>
  );
}
