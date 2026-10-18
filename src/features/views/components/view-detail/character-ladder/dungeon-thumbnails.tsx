import { MythicPlusBestRun, Season } from '@/features/views/api/wow-types.ts';
import './dungeon-thumbnails.css';

interface DungeonThumbnailsProps {
  season: Season;
  bestRuns: MythicPlusBestRun[];
}

export function DungeonThumbnails({ season, bestRuns }: Readonly<DungeonThumbnailsProps>) {
  return (
    <div className="dungeon-thumbnails">
      {season.dungeons.map((dungeon) => {
        const bestRun = bestRuns.find((br) => br.run.shortName === dungeon.shortName);
        return (
          <div
            key={dungeon.dungeonId}
            className="dungeon-thumb"
            title={bestRun?.run.dungeon ?? dungeon.name}
            onClick={() =>
              document
                .getElementById(`dungeon-card-${dungeon.shortName.toLowerCase()}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          >
            <span className="dungeon-thumb-level">{bestRun ? bestRun.run.keyLevel : ''}</span>
            <img src={dungeon.icon} alt={dungeon.name} className="dungeon-thumb-img" />
            <span className="dungeon-thumb-name">{dungeon.shortName}</span>
          </div>
        );
      })}
    </div>
  );
}
