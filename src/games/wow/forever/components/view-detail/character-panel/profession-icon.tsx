import { WowProfession } from '@/games/wow/forever/api/forever-types.ts';
import { EMPTY_SLOT_IMAGES } from '@/games/wow/forever/assets/gear-images.ts';
import { GameTooltip } from './game-tooltip.tsx';
import './profession-icon.css';

const FALLBACK_ICON = EMPTY_SLOT_IMAGES.Tabard;

/** A profession, its skill in the corner as a talent shows its rank. */
export function ProfessionIcon({ profession }: Readonly<{ profession: WowProfession }>) {
  const { name, skillPoints, maxSkillPoints } = profession;

  return (
    <GameTooltip
      label={`${name}, ${skillPoints} of ${maxSkillPoints}`}
      className="profession-icon"
      content={
        <>
          <p className="game-tooltip-title profession-tooltip-name">{name}</p>
          <p>
            Skill (
            <span className="profession-tooltip-skill">
              {skillPoints}/{maxSkillPoints}
            </span>
            )
          </p>
        </>
      }
    >
      <img
        src={profession.icon ?? FALLBACK_ICON}
        alt=""
        // Blizzard does not serve every icon: fall back to the empty tabard.
        onError={(e) => (e.currentTarget.src = FALLBACK_ICON)}
      />
      <span className="profession-icon-skill" aria-hidden={true}>
        {skillPoints}
      </span>
    </GameTooltip>
  );
}
