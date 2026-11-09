import { CSSProperties, useId, useState } from 'react';
import { Clock } from 'lucide-react';
import { CLASS_IMAGES, getClassImageKey } from '@/games/wow/class-images.ts';
import { CLASS_COLORS, getClassSlug } from '@/games/wow/class-colors.ts';
import { RACE_IMAGES, getRaceImageKey } from '@/games/wow/forever/assets/race-images.ts';
import { formatCharacterName } from '@/games/wow/forever/model/character.ts';
import { LadderEntry } from '@/games/wow/forever/model/ladder.ts';
import { regionLabel } from '@/games/wow/forever/constants/regions.ts';
import { compactTimeSince } from '@/games/wow/forever/model/last-login.ts';
import { CharacterPanel } from './character-panel/character-panel.tsx';

interface ForeverLadderRowProps {
  position: number;
  entry: LadderEntry;
}

export function ForeverLadderRow({ position, entry }: Readonly<ForeverLadderRowProps>) {
  const { character, standingChange, levelGain } = entry;
  const classIcon = CLASS_IMAGES[getClassImageKey(character.characterClass)];
  const raceImage = RACE_IMAGES[getRaceImageKey(character.race)];
  // Blizzard's render of the face; without one, the race, then the class.
  const portraitFallback = raceImage ?? classIcon;
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <li
      style={
        { '--class-color': CLASS_COLORS[getClassSlug(character.characterClass)] } as CSSProperties
      }
    >
      <button
        type="button"
        className="forever-row"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <span className="forever-row-position num">{position}</span>

        <span className="forever-portrait">
          <img
            className="forever-portrait-image"
            src={character.avatar ?? portraitFallback}
            alt=""
            onError={(e) => (e.currentTarget.src = portraitFallback)}
          />
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
          {/* Always a guild line, so every row has the same height. */}
          {character.guild ? (
            <p className="forever-guild">&lt;{character.guild}&gt;</p>
          ) : (
            <p className="forever-guild forever-guild--none">No guild</p>
          )}
          <div className="forever-row-tags">
            <span className="forever-badge" title="Ruleset">
              {character.ruleset}
            </span>
            <span className="forever-badge">{regionLabel(character.region)}</span>
          </div>
        </div>

        {/* Class and race side by side, as o7gg shows them; a race without art is left out. */}
        <span className="forever-identity">
          <img src={classIcon} alt={character.characterClass} title={character.characterClass} />
          {raceImage && (
            <img
              className="forever-identity-race"
              src={raceImage}
              alt={character.race}
              title={character.race}
            />
          )}
        </span>

        {/* A column of its own, beside the level, so item levels line up and can be
          compared down the ladder. */}
        <span className="forever-ilvl num" title="Equipped item level">
          <span className="sr-only">Item level </span>
          {character.equippedItemLevel}
        </span>

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

        <time
          className="forever-last-login"
          dateTime={character.lastLogin}
          title={`Last login ${new Date(character.lastLogin).toLocaleString()}`}
        >
          <Clock size={10} strokeWidth={2.25} aria-hidden />
          <span className="sr-only">Last login </span>
          {compactTimeSince(new Date(character.lastLogin), new Date())}
        </time>
      </button>

      {open && <CharacterPanel id={panelId} character={character} />}
    </li>
  );
}
