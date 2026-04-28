import { Skull } from "lucide-react";
import { MythicPlusRun, RunDetails, formatDate } from "@/features/views/api/raiderio.ts";
import { RosterRow } from "./roster-row.tsx";

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

  const deathCount = details.logged_details?.deaths?.length ?? 0;
  const sortedRoster = [...details.roster].sort(
    (a, b) => (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99),
  );

  return (
    <div className="run-details-panel">
      <div className="run-details-top">
        <span className="run-details-deaths">
          <Skull className="skull-icon" />x {deathCount}
        </span>
      </div>
      <div className="run-details-roster">
        {sortedRoster.map((entry) => (
          <RosterRow
            key={`${entry.character.name}-${entry.character.realm.slug}`}
            entry={entry}
            characterRegion={characterRegion}
          />
        ))}
      </div>
      <div className="run-details-footer">
        <span className="run-details-date">{formatDate(run.completed_at)}</span>
      </div>
    </div>
  );
}
