import { CSSProperties } from 'react';
import { WowItem } from '@/games/wow/forever/api/forever-types.ts';
import { EMPTY_SLOT_IMAGES } from '@/games/wow/forever/assets/gear-images.ts';
import { ITEM_QUALITY_COLORS } from '@/games/wow/forever/constants/item-quality.ts';
import { GameTooltip } from './game-tooltip.tsx';
import { ItemTooltip } from './item-tooltip.tsx';
import './item-slot.css';

interface ItemSlotProps {
  slot: string;
  item: WowItem | undefined;
}

/** An item's icon, framed in its quality colour, that opens its tooltip. */
export function ItemSlot({ slot, item }: Readonly<ItemSlotProps>) {
  if (!item) {
    return (
      <img
        className="item-slot item-slot--empty"
        src={EMPTY_SLOT_IMAGES[slot]}
        alt={`${slot}: empty`}
        title={`${slot}: empty`}
      />
    );
  }

  return (
    <GameTooltip
      label={item.name}
      className="item-slot"
      style={{ '--quality-color': ITEM_QUALITY_COLORS[item.quality] } as CSSProperties}
      content={<ItemTooltip item={item} />}
    >
      <img
        src={item.icon ?? EMPTY_SLOT_IMAGES[slot]}
        alt=""
        // Blizzard does not serve every icon: fall back to the slot's own art.
        onError={(e) => (e.currentTarget.src = EMPTY_SLOT_IMAGES[slot])}
      />
    </GameTooltip>
  );
}
