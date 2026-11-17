import { useState } from 'react';
import { ForeverCharacter } from '@/games/wow/forever/api/forever-types.ts';
import { formatCharacterName } from '@/games/wow/forever/model/character.ts';
import { wowheadTalentCalc } from '@/games/wow/forever/model/talents.ts';
import '@/shared/components/loading-ring.css';
import './talent-trees.css';

/** The character's talent trees, in Wowhead's calculator. */
export function TalentTrees({ character }: Readonly<{ character: ForeverCharacter }>) {
  const name = formatCharacterName(character);
  const spent = character.talents?.some((tree) => tree.points > 0);
  const calc = character.talents && wowheadTalentCalc(character.characterClass, character.talents);
  // The build last loaded: a new one loads its page again.
  const [loadedCalc, setLoadedCalc] = useState<string | null>(null);

  return (
    <section aria-label={`Talents of ${name}`}>
      {!character.talents && <p className="character-panel-missing">Talents haven't synced yet.</p>}
      {character.talents && !spent && (
        <p className="character-panel-missing">No talent points spent yet.</p>
      )}
      {spent && !calc && (
        <p className="character-panel-missing">These talents can't be shown on Wowhead yet.</p>
      )}
      {spent && calc && (
        <div className="talent-trees-window">
          {loadedCalc !== calc && (
            <div className="talent-trees-loading" role="status">
              <div className="loading-ring" />
              <span className="sr-only">Loading the talents from Wowhead…</span>
            </div>
          )}
          <iframe
            className="talent-trees-calc"
            src={calc}
            title={`Talents of ${name} on Wowhead`}
            onLoad={() => setLoadedCalc(calc)}
          />
        </div>
      )}
    </section>
  );
}
