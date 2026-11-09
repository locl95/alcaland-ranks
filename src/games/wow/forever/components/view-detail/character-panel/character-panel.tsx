import { ForeverCharacter } from '@/games/wow/forever/api/forever-types.ts';
import { EquipmentSheet } from './equipment-sheet.tsx';
import { TalentTrees } from './talent-trees.tsx';
import './character-panel.css';

interface CharacterPanelProps {
  id: string;
  character: ForeverCharacter;
}

/** What opens under a ladder row: the character's equipment, then their talents. */
export function CharacterPanel({ id, character }: Readonly<CharacterPanelProps>) {
  return (
    <div id={id} className="character-panel">
      <EquipmentSheet character={character} />
      <TalentTrees character={character} />
    </div>
  );
}
