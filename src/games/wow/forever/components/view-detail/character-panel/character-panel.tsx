import { ForeverCharacter } from '@/games/wow/forever/api/forever-types.ts';
import { hasPvpToShow } from '@/games/wow/forever/model/pvp.ts';
import { EquipmentSheet } from './equipment-sheet.tsx';
import { Professions } from './professions.tsx';
import { PvpStanding } from './pvp-standing.tsx';
import { TalentTrees } from './talent-trees.tsx';
import './character-panel.css';

interface CharacterPanelProps {
  id: string;
  character: ForeverCharacter;
}

/** What opens under a ladder row: the character's PvP, professions, talents and equipment. */
export function CharacterPanel({ id, character }: Readonly<CharacterPanelProps>) {
  return (
    <div id={id} className="character-panel">
      <div className="character-panel-layout">
        <div>
          <h3 className="character-panel-title eyebrow">PvP</h3>
          {hasPvpToShow(character.pvp) ? (
            <PvpStanding character={character} pvp={character.pvp} />
          ) : (
            <p className="character-panel-missing">
              {character.pvp ? 'No honorable kills yet.' : "PvP hasn't synced yet."}
            </p>
          )}
        </div>
        <div>
          <h3 className="character-panel-title eyebrow">Professions</h3>
          <Professions character={character} />
        </div>
        <div className="character-panel-talents">
          <h3 className="character-panel-title eyebrow">Talents</h3>
          <TalentTrees character={character} />
        </div>
        <div className="character-panel-equipment">
          <h3 className="character-panel-title eyebrow">Equipment</h3>
          <EquipmentSheet character={character} />
        </div>
      </div>
    </div>
  );
}
