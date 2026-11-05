import './run-details-panel.css';
import { MythicPlusRun, RunDetails, formatDate } from '@/games/wow/api/wow-types.ts';
import { RosterRow } from './roster-row.tsx';

const ROLE_ORDER: Record<string, number> = { tank: 0, healer: 1, dps: 2 };

interface RunDetailsPanelProps {
  run: MythicPlusRun;
  details: RunDetails | null;
  characterRegion: string;
}

export function RunDetailsPanel({ run, details, characterRegion }: Readonly<RunDetailsPanelProps>) {
  if (!details) {
    return (
      <div className="run-details-panel">
        <div className="run-details-unavailable">Run details are currently unavailable.</div>
      </div>
    );
  }

  const sortedMembers = [...details.members].sort(
    (a, b) => (ROLE_ORDER[a.spec.role] ?? 99) - (ROLE_ORDER[b.spec.role] ?? 99),
  );

  return (
    <div className="run-details-panel">
      <div className="run-details-roster">
        {sortedMembers.map((member) => (
          <RosterRow
            key={`${member.name}-${member.realm}`}
            member={member}
            characterRegion={characterRegion}
          />
        ))}
      </div>
      <div className="run-details-footer">
        <span className="run-details-date">{formatDate(run.dateCompleted)}</span>
      </div>
    </div>
  );
}
