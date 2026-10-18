import { useState } from 'react';
import './recent-runs.css';
import { ChevronDown, ChevronUp, Crown } from 'lucide-react';
import {
  MythicPlusBestRun,
  MythicPlusRecentRun,
  formatClearTime,
  formatDate,
} from '@/features/views/api/wow-types.ts';
import { KEYSTONE_DISPLAY } from '@/features/views/constants/keystone.ts';
import { CLASS_TEXT_COLORS } from '@/features/views/constants/class-colors.ts';

import { getClassSlug } from '@/features/views/utils.ts';

interface RecentRunsProps {
  recentRuns: MythicPlusRecentRun[];
  bestRuns: MythicPlusBestRun[];
  characterClass: string;
}

export function RecentRuns({ recentRuns, bestRuns, characterClass }: Readonly<RecentRunsProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const runs = showAll ? recentRuns : recentRuns.slice(0, 5);
  const hasMore = recentRuns.length > runs.length;
  const specColor = CLASS_TEXT_COLORS[getClassSlug(characterClass)];
  const bestRunIds = new Set(bestRuns.map((br) => br.run.runId));

  return (
    <div className="recent-runs-section">
      <button className="recent-runs-toggle" onClick={() => setIsOpen(!isOpen)}>
        <span>Recent mythic+ activity</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isOpen && (
        <div className="recent-runs-list">
          {runs.length === 0 ? (
            <div className="recent-runs-empty">No recent run data</div>
          ) : (
            runs.map((run) => (
              <a
                key={run.runId}
                href={run.url}
                target="_blank"
                rel="noopener noreferrer"
                className="recent-run-row"
              >
                <span className="recent-run-name">{run.shortName}</span>
                <span
                  className="recent-run-spec"
                  style={specColor ? { color: specColor } : undefined}
                >
                  {run.spec.name}
                </span>
                {(() => {
                  const { prefix, className } =
                    KEYSTONE_DISPLAY[run.upgrades] ?? KEYSTONE_DISPLAY[0];
                  return (
                    <span className={`recent-run-level ${className}`}>
                      {prefix}
                      {run.keyLevel}
                    </span>
                  );
                })()}
                <span className="recent-run-time">{formatClearTime(run.clearTimeMs)}</span>
                <span className={`recent-run-status ${run.upgrades > 0 ? 'timed' : 'depleted'}`}>
                  {run.upgrades > 0 ? 'Timed' : 'Depleted'}
                  {bestRunIds.has(run.runId) && <Crown size={11} className="recent-run-crown" />}
                </span>
                <span className="recent-run-date">{formatDate(run.dateCompleted)}</span>
              </a>
            ))
          )}
          {hasMore && (
            <button className="recent-runs-show-more" onClick={() => setShowAll(!showAll)}>
              {showAll ? (
                <>
                  <ChevronUp size={13} /> Show less
                </>
              ) : (
                <>
                  <ChevronDown size={13} /> Show {recentRuns.length - 5} more
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
