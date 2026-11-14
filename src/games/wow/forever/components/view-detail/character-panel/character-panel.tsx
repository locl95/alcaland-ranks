import { ForeverCharacter } from '@/games/wow/forever/api/forever-types.ts';
import { hasPvpToShow } from '@/games/wow/forever/model/pvp.ts';
import { EquipmentSheet } from './equipment-sheet.tsx';
import { PvpStanding } from './pvp-standing.tsx';
import { TalentTrees } from './talent-trees.tsx';
import './character-panel.css';

interface CharacterPanelProps {
  id: string;
  character: ForeverCharacter;
}

/** What opens under a ladder row: the character's PvP, talents and equipment. */
export function CharacterPanel({ id, character }: Readonly<CharacterPanelProps>) {
  return (
    <div id={id} className="character-panel">
      <div className="character-panel-layout">
        {hasPvpToShow(character.pvp) && (
          <div className="character-panel-pvp">
            <PvpStanding character={character} pvp={character.pvp} />
          </div>
        )}
        <div className="character-panel-talents">
          <TalentTrees character={character} />
        </div>
        <div className="character-panel-equipment">
          <EquipmentSheet character={character} />
        </div>
      </div>
    </div>
  );
}
