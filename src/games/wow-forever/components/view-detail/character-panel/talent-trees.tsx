import { ForeverCharacter } from '@/games/wow-forever/api/forever-types.ts';
import { SPEC_IMAGES, getSpecImageKey } from '@/games/wow-forever/assets/spec-images.ts';
import { formatCharacterName } from '@/games/wow-forever/model/character.ts';
import { spentTrees } from '@/games/wow-forever/model/talents.ts';
import { TalentIcon } from './talent-icon.tsx';
import './talent-trees.css';

/** Each specialization with points in it, and the talents trained there. */
export function TalentTrees({ character }: Readonly<{ character: ForeverCharacter }>) {
  const trees = character.talents ? spentTrees(character.talents) : [];

  return (
    <section className="talent-trees" aria-label={`Talents of ${formatCharacterName(character)}`}>
      {!character.talents && <p className="character-panel-missing">Talents haven't synced yet.</p>}
      {character.talents && trees.length === 0 && (
        <p className="character-panel-missing">No talent points spent yet.</p>
      )}
      {trees.map((tree) => {
        const specIcon = SPEC_IMAGES[getSpecImageKey(character.characterClass, tree.name)];
        return (
          <div key={tree.name} className="talent-tree">
            <div className="talent-tree-head">
              {specIcon && <img className="talent-tree-icon" src={specIcon} alt="" />}
              <h3 className="talent-tree-name">{tree.name}</h3>
              <span className="talent-tree-points num">
                {tree.points}
                <span className="sr-only"> points</span>
              </span>
            </div>
            <ul className="talent-tree-talents">
              {tree.talents.map((talent) => (
                <li key={talent.spellId}>
                  <TalentIcon talent={talent} fallbackIcon={specIcon} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
