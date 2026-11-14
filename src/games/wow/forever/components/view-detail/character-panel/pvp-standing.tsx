import { Swords } from 'lucide-react';
import { ForeverCharacter, WowPvp } from '@/games/wow/forever/api/forever-types.ts';
import { formatCharacterName } from '@/games/wow/forever/model/character.ts';
import rankBadge from '@/games/wow/forever/assets/pvp/badge_of_justice.webp';
import './pvp-standing.css';

interface PvpStandingProps {
  character: ForeverCharacter;
  pvp: WowPvp;
}

/** The character's PvP rank and honorable kills. */
export function PvpStanding({ character, pvp }: Readonly<PvpStandingProps>) {
  return (
    <section className="pvp-standing" aria-label={`PvP of ${formatCharacterName(character)}`}>
      <span className="pvp-standing-item">
        <img className="pvp-standing-badge" src={rankBadge} alt="" />
        Rank {pvp.rank}
      </span>
      <span className="pvp-standing-item">
        <Swords className="pvp-standing-icon" aria-hidden={true} />
        <span className="num">{pvp.honorableKills}</span> honorable kills
      </span>
    </section>
  );
}
