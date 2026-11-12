import { Swords } from 'lucide-react';
import { ForeverCharacter } from '@/games/wow/forever/api/forever-types.ts';
import { formatCharacterName } from '@/games/wow/forever/model/character.ts';
import rankBadge from '@/games/wow/assets/pvp/badge_of_justice.webp';
import './pvp-standing.css';

/** The character's rank and honorable kills, once they have any kills to show. */
export function PvpStanding({ character }: Readonly<{ character: ForeverCharacter }>) {
  const { pvp } = character;
  if (!pvp || pvp.honorableKills <= 0) return null;

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
