import { ForeverCharacter } from '@/games/wow/forever/api/forever-types.ts';
import {
  LEFT_SLOTS,
  RIGHT_SLOTS,
  WEAPON_SLOTS,
} from '@/games/wow/forever/constants/equipment-slots.ts';
import { formatCharacterName } from '@/games/wow/forever/model/character.ts';
import { itemsBySlot } from '@/games/wow/forever/model/item.ts';
import { hasOffHandWeapon } from '@/games/wow/forever/model/stats.ts';
import { CharacterStats } from './character-stats.tsx';
import { ItemSlot } from './item-slot.tsx';
import './equipment-sheet.css';

/** The character sheet: armour down both sides, stats between, weapons along the bottom. */
export function EquipmentSheet({ character }: Readonly<{ character: ForeverCharacter }>) {
  const { items, stats } = character;
  const label = `Equipment of ${formatCharacterName(character)}`;

  if (!items) {
    return (
      <section className="equipment-sheet" aria-label={label}>
        <p className="character-panel-missing">Equipment hasn't synced yet.</p>
      </section>
    );
  }

  const bySlot = itemsBySlot(items);
  const slotsOf = (slots: string[]) =>
    slots.map((slot) => <ItemSlot key={slot} slot={slot} item={bySlot.get(slot)} />);

  return (
    <section className="equipment-sheet" aria-label={label}>
      <div className="equipment-column equipment-column--left">{slotsOf(LEFT_SLOTS)}</div>
      {stats && <CharacterStats stats={stats} offHandWeapon={hasOffHandWeapon(items)} />}
      <div className="equipment-column equipment-column--right">{slotsOf(RIGHT_SLOTS)}</div>
      <div className="equipment-weapons">{slotsOf(WEAPON_SLOTS)}</div>
    </section>
  );
}
