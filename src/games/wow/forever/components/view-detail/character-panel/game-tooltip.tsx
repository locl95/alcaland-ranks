import { CSSProperties, ReactNode, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import './game-tooltip.css';

interface GameTooltipProps {
  /** The accessible name of the icon button. */
  label: string;
  className: string;
  style?: CSSProperties;
  /** What is shown in the tooltip. */
  content: ReactNode;
  /** What the button shows: the icon. */
  children: ReactNode;
}

/**
 * An icon button with a game-style tooltip: it opens on hover with a mouse, on
 * tap with a finger and on Enter with the keyboard.
 */
export function GameTooltip({
  label,
  className,
  style,
  content,
  children,
}: Readonly<GameTooltipProps>) {
  const [open, setOpen] = useState(false);
  // A mouse already opened the tooltip by hovering, so its click must not toggle
  // it shut. Touch and keyboard clicks still toggle.
  const pointerType = useRef<string | null>(null);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={className}
          style={style}
          aria-label={label}
          onPointerDown={(e) => (pointerType.current = e.pointerType)}
          onPointerEnter={(e) => e.pointerType === 'mouse' && setOpen(true)}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setOpen(false)}
          onClick={(e) => {
            if (pointerType.current === 'mouse') e.preventDefault();
            pointerType.current = null;
          }}
        >
          {children}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="game-tooltip"
          side="right"
          align="start"
          sideOffset={8}
          collisionPadding={8}
          // Focus stays on the icon: the tooltip has nothing to interact with.
          onOpenAutoFocus={(e) => e.preventDefault()}
          // Nor is focus handed back on close. Focusing this icon again would
          // land outside the tooltip the mouse just opened on the next icon,
          // and that counts as dismissing it.
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {content}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
