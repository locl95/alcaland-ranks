import './character-run.css';
import { useState } from 'react';
import { Crown } from 'lucide-react';
import {
  MythicPlusBestRun,
  RaiderioProfile,
  formatClearTime,
} from '@/features/views/api/raiderio.ts';
import { formatTimeDelta, getClassSlug } from '@/features/views/utils.ts';
import { KEYSTONE_DISPLAY } from '@/features/views/constants/keystone.ts';
import { CLASS_COLORS } from '@/features/views/constants/class-colors.ts';
import { SPEC_IMAGES, getSpecImageKey } from '@/features/views/constants/spec-images.ts';
import { RunDetailsPanel } from './run-details-panel.tsx';

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
  const timeDelta =
    run && run.par_time_ms != null ? formatTimeDelta(run.clear_time_ms, run.par_time_ms) : null;
  const keystone = run
    ? (KEYSTONE_DISPLAY[run.num_keystone_upgrades] ?? KEYSTONE_DISPLAY[0])
    : null;

  return (
    <div className="character-run-wrapper">
      <div
        className={`character-run ${isHighest ? 'highest' : 'normal'} ${isExpanded ? 'expanded' : ''}`}
        onClick={() => run && setIsExpanded((prev) => !prev)}
      >
        <div className="character-run-left">
          {isHighest && <Crown className="crown-icon" />}
          {specImg && <img src={specImg} alt={specName} title={specName} className="spec-icon" />}
          <p
            className={`character-run-name ${isHighest ? 'highest' : 'normal'}`}
            style={{
              color: CLASS_COLORS[getClassSlug(character.class)] ?? 'var(--ink)',
            }}
          >
            {character.name}
          </p>
        </div>

        {run && keystone ? (
          <>
            <div className="character-run-score-cell">
              {scoreImprovement > 0 && (
                <span className="score-improvement num">+{Math.round(scoreImprovement)}</span>
              )}
              <span className={`character-run-score num ${isHighest ? 'highest' : 'normal'}`}>
                {Math.round(run.score)}
              </span>
            </div>

            <span className={`character-run-key num ${keystone.className}`}>
              {keystone.prefix}
              {run.mythic_level}
            </span>

            <span className="character-run-time num">
              {formatClearTime(run.clear_time_ms)}
              {timeDelta && (
                <span className={timeDelta.timed ? 'time-delta-timed' : 'time-delta-depleted'}>
                  {timeDelta.text}
                </span>
              )}
            </span>
          </>
        ) : (
          <span className="character-run-no-data">No run</span>
        )}
      </div>

      {run && isExpanded && (
        <RunDetailsPanel run={run} details={bestRun!.details} characterRegion={character.region} />
      )}
    </div>
  );
}
