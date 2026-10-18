import './dungeon-card.css';
import {
  MythicPlusBestRun,
  MythicPlusRun,
  WowProfile,
  Season,
} from '@/features/views/api/wow-types.ts';
import { useEntityPage } from '@/features/views/hooks/useEntityPage.ts';
import { CharacterRun } from './character-run.tsx';
import { Pager } from '@/features/views/components/shared/pager.tsx';

export interface CharacterDungeonScore {
  character: WowProfile;
  bestRun: MythicPlusBestRun | undefined;
}

interface DungeonCardProps {
  dungeon: Season['dungeons'][number];
  characterScores: CharacterDungeonScore[];
  winningRun: MythicPlusRun | undefined;
  cachedProfiles: WowProfile[];
}

export function DungeonCard({
  dungeon,
  characterScores,
  winningRun,
  cachedProfiles,
}: Readonly<DungeonCardProps>) {
  const { pageItems, pagination } = useEntityPage(characterScores);

  return (
    <div className="dungeon-card" id={`dungeon-card-${dungeon.shortName.toLowerCase()}`}>
      <div className="dungeon-header">
        <div className="dungeon-header-thumb">
          <img src={dungeon.icon} alt="" aria-hidden={true} className="dungeon-header-thumb-img" />
        </div>
        <h3 className="dungeon-title">{dungeon.name}</h3>
        <span className="dungeon-header-thumb-name">{dungeon.shortName}</span>
      </div>
      <div className="dungeon-cols">
        <span className="eyebrow">Character</span>
        <span className="eyebrow">Score</span>
        <span className="eyebrow">Key</span>
        <span className="eyebrow">Time</span>
      </div>
      <div className="dungeon-content">
        {pageItems.map(({ character, bestRun }) => {
          const run = bestRun?.run;
          const isHighest =
            !!winningRun &&
            run?.score === winningRun.score &&
            run?.clearTimeMs === winningRun.clearTimeMs;

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
      <Pager label={`${dungeon.name} pages`} pagination={pagination} />
    </div>
  );
}
