import { WowTalent } from '@/games/wow-forever/api/forever-types.ts';
import { GameTooltip } from './game-tooltip.tsx';
import { TalentTooltip } from './talent-tooltip.tsx';
import './talent-icon.css';

interface TalentIconProps {
  talent: WowTalent;
  /** Shown when Blizzard has or serves no icon for the talent: its tree's. */
  fallbackIcon: string | undefined;
}

/** A trained talent, its rank in the corner as on the game's talent pane. */
export function TalentIcon({ talent, fallbackIcon }: Readonly<TalentIconProps>) {
  return (
    <GameTooltip
      label={`${talent.name}, rank ${talent.rank}`}
      className="talent-icon"
      content={<TalentTooltip talent={talent} />}
    >
      <img
        src={talent.icon ?? fallbackIcon}
        alt=""
        // Blizzard does not serve every icon: fall back to the tree's.
        onError={(e) => fallbackIcon && (e.currentTarget.src = fallbackIcon)}
      />
      <span className="talent-icon-rank" aria-hidden={true}>
        {talent.rank}
      </span>
    </GameTooltip>
  );
}
