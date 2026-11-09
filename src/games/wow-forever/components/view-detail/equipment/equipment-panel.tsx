import { ForeverCharacter } from '@/games/wow-forever/api/forever-types.ts';
import {
  LEFT_SLOTS,
  RIGHT_SLOTS,
  WEAPON_SLOTS,
} from '@/games/wow-forever/constants/equipment-slots.ts';
import { formatCharacterName } from '@/games/wow-forever/model/character.ts';
import { itemsBySlot } from '@/games/wow-forever/model/item.ts';
import { ItemSlot } from './item-slot.tsx';
import './equipment-panel.css';

interface EquipmentPanelProps {
  id: string;
  character: ForeverCharacter;
}

/** The character sheet: armour down both sides, weapons along the bottom. */
export function EquipmentPanel({ id, character }: Readonly<EquipmentPanelProps>) {
  const bySlot = itemsBySlot(character.items);

  const slotsOf = (slots: string[]) =>
    slots.map((slot) => <ItemSlot key={slot} slot={slot} item={bySlot.get(slot)} />);

  return (
    <section
      id={id}
      className="equipment-panel"
      aria-label={`Equipment of ${formatCharacterName(character)}`}
    >
      <div className="equipment-column equipment-column--left">{slotsOf(LEFT_SLOTS)}</div>
      <div className="equipment-column equipment-column--right">{slotsOf(RIGHT_SLOTS)}</div>
      <div className="equipment-weapons">{slotsOf(WEAPON_SLOTS)}</div>
    </section>
  );
}
