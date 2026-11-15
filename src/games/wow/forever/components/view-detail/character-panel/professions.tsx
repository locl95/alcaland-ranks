import { ForeverCharacter, WowProfession } from '@/games/wow/forever/api/forever-types.ts';
import { formatCharacterName } from '@/games/wow/forever/model/character.ts';
import { ProfessionIcon } from './profession-icon.tsx';
import './professions.css';

/** The character's professions: the primary ones, then the secondary. */
export function Professions({ character }: Readonly<{ character: ForeverCharacter }>) {
  const { professions } = character;
  const groups: [string, WowProfession[]][] = professions
    ? [
        ['Primary professions', professions.primaries],
        ['Secondary professions', professions.secondaries],
      ]
    : [];
  const learned = groups.filter(([, list]) => list.length > 0);

  return (
    <section
      className="professions"
      aria-label={`Professions of ${formatCharacterName(character)}`}
    >
      {!professions && <p className="character-panel-missing">Professions haven't synced yet.</p>}
      {professions && learned.length === 0 && (
        <p className="character-panel-missing">No professions learned yet.</p>
      )}
      {learned.map(([label, list]) => (
        <ul key={label} className="professions-group" aria-label={label}>
          {list.map((profession) => (
            <li key={profession.id}>
              <ProfessionIcon profession={profession} />
            </li>
          ))}
        </ul>
      ))}
    </section>
  );
}
