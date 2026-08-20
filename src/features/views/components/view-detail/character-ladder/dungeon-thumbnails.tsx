import { MythicPlusBestRun, Season } from '@/features/views/api/raiderio.ts';
import './dungeon-thumbnails.css';

interface DungeonThumbnailsProps {
  season: Season;
  bestRuns: MythicPlusBestRun[];
}

export function DungeonThumbnails({ season, bestRuns }: Readonly<DungeonThumbnailsProps>) {
  return (
    <div className="dungeon-thumbnails">
      {season.dungeons.map((dungeon) => {
        const bestRun = bestRuns.find((br) => br.run.short_name === dungeon.short_name);
        return (
          <div
            key={dungeon.challenge_mode_id}
            className="dungeon-thumb"
            title={bestRun?.run.dungeon ?? dungeon.name}
            onClick={() =>
              document
                .getElementById(`dungeon-card-${dungeon.short_name.toLowerCase()}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          >
            <span className="dungeon-thumb-level">{bestRun ? bestRun.run.mythic_level : ''}</span>
            <img src={dungeon.icon_url} alt={dungeon.name} className="dungeon-thumb-img" />
            <span className="dungeon-thumb-name">{dungeon.short_name}</span>
          </div>
        );
      })}
    </div>
  );
}
