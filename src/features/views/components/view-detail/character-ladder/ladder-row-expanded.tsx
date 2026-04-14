import { RaiderioProfile, Season } from "@/features/views/api/raiderio.ts";
import "./ladder-row-expanded.css";
import { DungeonThumbnails } from "./dungeon-thumbnails.tsx";
import { RecentRuns } from "./recent-runs.tsx";
import { RankingsTable } from "./rankings-table.tsx";
import { SpecRankingsTable } from "./spec-rankings-table.tsx";

interface LadderRowExpandedProps {
  character: RaiderioProfile;
  cachedCharacter: RaiderioProfile | undefined;
  season: Season | null;
}

export function LadderRowExpanded({
  character,
  cachedCharacter,
  season,
}: Readonly<LadderRowExpandedProps>) {
  return (
    <div className="ladder-row-expanded">
        {season && (
            <DungeonThumbnails
                season={season}
                bestRuns={character.mythicPlusBestRuns}
            />
        )}

        <RecentRuns
            recentRuns={character.mythicPlusRecentRuns ?? []}
            bestRuns={character.mythicPlusBestRuns}
            characterClass={character.class}
        />

      {character.quantile != null && (
        <div className="quantile-banner">
          <span className="quantile-label">Top</span>
          <span className="quantile-value">
            {character.quantile.toFixed(2)}%
          </span>
          <span className="quantile-label">of all players</span>
        </div>
      )}

      <RankingsTable character={character} cachedProfile={cachedCharacter} />

      <SpecRankingsTable
        character={character}
        cachedProfile={cachedCharacter}
      />
    </div>
  );
}
