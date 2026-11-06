import { CSSProperties } from 'react';
import { Swords } from 'lucide-react';
import { CLASS_IMAGES, getClassImageKey } from '@/shared/warcraft/class-images.ts';
import { CLASS_COLORS, getClassSlug } from '@/shared/warcraft/class-colors.ts';
import { RACE_IMAGES, getRaceImageKey } from '@/shared/warcraft/race-images.ts';
import { formatCharacterName } from '@/games/wow-forever/model/character.ts';
import { LadderEntry } from '@/games/wow-forever/model/ladder.ts';
import { regionLabel } from '@/games/wow-forever/constants/regions.ts';

interface ForeverLadderRowProps {
  position: number;
  entry: LadderEntry;
}

export function ForeverLadderRow({ position, entry }: Readonly<ForeverLadderRowProps>) {
  const { character, standingChange, levelGain } = entry;
  const classIcon = CLASS_IMAGES[getClassImageKey(character.characterClass)];
  const raceImage = RACE_IMAGES[getRaceImageKey(character.race)];

  return (
    <li
      className="forever-row"
      style={
        { '--class-color': CLASS_COLORS[getClassSlug(character.characterClass)] } as CSSProperties
      }
    >
      <span className="forever-row-position num">{position}</span>

      <span className="forever-portrait">
        {/* The race is the portrait, with the class on its corner; a race without art
            yet leaves the class icon as the portrait. */}
        {raceImage ? (
          <>
            <img
              className="forever-portrait-image"
              src={raceImage}
              alt={character.race}
              title={character.race}
            />
            <img
              className="forever-class-badge"
              src={classIcon}
              alt={character.characterClass}
              title={character.characterClass}
            />
          </>
        ) : (
          <img
            className="forever-portrait-image"
            src={classIcon}
            alt={character.characterClass}
            title={character.characterClass}
          />
        )}
      </span>

      <div className="forever-row-info">
        <div className="forever-row-name-line">
          <p className="forever-row-name">{formatCharacterName(character)}</p>
          {standingChange !== null && standingChange !== 0 && (
            <span
              className={`forever-standing ${standingChange > 0 ? 'forever-standing--up' : 'forever-standing--down'}`}
            >
              {standingChange > 0 ? `↑ ${standingChange}` : `↓ ${-standingChange}`}
            </span>
          )}
        </div>
        <div className="forever-row-meta">
          <span className="forever-ilvl num" title="Equipped item level">
            <Swords className="forever-ilvl-icon" aria-hidden={true} />
            {character.equippedItemLevel}
          </span>
          {character.guild && <span className="forever-guild">&lt;{character.guild}&gt;</span>}
          <span className="forever-badge" title="Ruleset">
            {character.ruleset}
          </span>
          <span className="forever-badge">{regionLabel(character.region)}</span>
        </div>
      </div>

      <div className="forever-level">
        {levelGain > 0 && (
          <span className="forever-level-gain num" title="Levels gained since the last snapshot">
            +{levelGain}
          </span>
        )}
        <span className="forever-level-value num">
          <span className="sr-only">Level </span>
          {character.level}
        </span>
      </div>
    </li>
  );
}
