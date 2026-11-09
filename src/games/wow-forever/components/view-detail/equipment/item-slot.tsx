import { CSSProperties, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { WowItem } from '@/games/wow-forever/api/forever-types.ts';
import { EMPTY_SLOT_IMAGES } from '@/games/wow-forever/assets/gear-images.ts';
import { ITEM_QUALITY_COLORS } from '@/games/wow-forever/constants/item-quality.ts';
import { ItemTooltip } from './item-tooltip.tsx';
import './item-slot.css';

interface ItemSlotProps {
  slot: string;
  item: WowItem | undefined;
}

/**
 * An item's icon, framed in its quality colour, that opens its tooltip: on hover
 * with a mouse, on tap with a finger, on Enter with the keyboard.
 */
export function ItemSlot({ slot, item }: Readonly<ItemSlotProps>) {
  const [open, setOpen] = useState(false);
  // A mouse already opened the tooltip by hovering, so its click must not toggle
  // it shut. Touch and keyboard clicks still toggle.
  const pointerType = useRef<string | null>(null);

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
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="item-slot"
          style={{ '--quality-color': ITEM_QUALITY_COLORS[item.quality] } as CSSProperties}
          aria-label={item.name}
          onPointerDown={(e) => (pointerType.current = e.pointerType)}
          onPointerEnter={(e) => e.pointerType === 'mouse' && setOpen(true)}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setOpen(false)}
          onClick={(e) => {
            if (pointerType.current === 'mouse') e.preventDefault();
            pointerType.current = null;
          }}
        >
          <img
            src={item.icon ?? EMPTY_SLOT_IMAGES[slot]}
            alt=""
            // Blizzard does not serve every icon: fall back to the slot's own art.
            onError={(e) => (e.currentTarget.src = EMPTY_SLOT_IMAGES[slot])}
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="item-slot-popover"
          side="right"
          align="start"
          sideOffset={8}
          collisionPadding={8}
          // Focus stays on the icon: the tooltip has nothing to interact with.
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <ItemTooltip item={item} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
