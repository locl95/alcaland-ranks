import { WowTalent } from '@/games/wow/forever/api/forever-types.ts';
import './talent-tooltip.css';

export function TalentTooltip({ talent }: Readonly<{ talent: WowTalent }>) {
  return (
    <>
      <p className="game-tooltip-title">{talent.name}</p>
      <p>Rank {talent.rank}</p>
      <p className="talent-tooltip-description">{talent.description}</p>
    </>
  );
}
