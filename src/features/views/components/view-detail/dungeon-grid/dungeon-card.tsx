import "./dungeon-card.css";
import { MythicPlusBestRun, MythicPlusRun, RaiderioProfile, Season } from "@/features/views/api/raiderio.ts";
import { DUNGEON_IMAGES } from "@/features/views/constants/dungeon-images.ts";
import { CharacterRun } from "./character-run.tsx";

export interface CharacterDungeonScore {
  character: RaiderioProfile;
  bestRun: MythicPlusBestRun | undefined;
}

interface DungeonCardProps {
  dungeon: Season["dungeons"][number];
  characterScores: CharacterDungeonScore[];
  winningRun: MythicPlusRun | undefined;
  cachedProfiles: RaiderioProfile[];
}

export function DungeonCard({
  dungeon,
  characterScores,
  winningRun,
  cachedProfiles,
}: Readonly<DungeonCardProps>) {
  return (
    <div className="dungeon-card">
      <div className="dungeon-header">
        <div className="dungeon-title">{dungeon.name}</div>
        <div className="dungeon-header-thumb">
          <img
            src={DUNGEON_IMAGES[dungeon.short_name.toLowerCase()]}
            alt={dungeon.name}
            className="dungeon-header-thumb-img"
          />
          <span className="dungeon-header-thumb-name">{dungeon.short_name}</span>
        </div>
      </div>
      <div className="dungeon-content">
        {characterScores.map(({ character, bestRun }) => {
          const run = bestRun?.run;
          const isHighest =
            !!winningRun &&
            run?.score === winningRun.score &&
            run?.clear_time_ms === winningRun.clear_time_ms;

          return (
            <CharacterRun
              key={character.id}
              character={character}
              bestRun={bestRun}
              isHighest={isHighest}
              cachedProfiles={cachedProfiles}
            />
          );
        })}
      </div>
    </div>
  );
}
