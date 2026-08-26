import './dungeon-card.css';
import {
  MythicPlusBestRun,
  MythicPlusRun,
  RaiderioProfile,
  Season,
} from '@/features/views/api/raiderio.ts';
import { useEntityPage } from '@/features/views/hooks/useEntityPage.ts';
import { CharacterRun } from './character-run.tsx';
import { EntityPager } from '../entity-pager.tsx';

export interface CharacterDungeonScore {
  character: RaiderioProfile;
  bestRun: MythicPlusBestRun | undefined;
}

interface DungeonCardProps {
  dungeon: Season['dungeons'][number];
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
  const { pageItems, startIndex, page, pageCount, total, goPrev, goNext } =
    useEntityPage(characterScores);

  return (
    <div className="dungeon-card" id={`dungeon-card-${dungeon.short_name.toLowerCase()}`}>
      <div className="dungeon-header">
        <div className="dungeon-header-thumb">
          <img
            src={dungeon.icon_url}
            alt=""
            aria-hidden={true}
            className="dungeon-header-thumb-img"
          />
        </div>
        <h3 className="dungeon-title">{dungeon.name}</h3>
        <span className="dungeon-header-thumb-name">{dungeon.short_name}</span>
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
      <EntityPager
        page={page}
        pageCount={pageCount}
        startIndex={startIndex}
        count={pageItems.length}
        total={total}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  );
}
