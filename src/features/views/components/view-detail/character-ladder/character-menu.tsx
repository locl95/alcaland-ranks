import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './character-menu.css';
import { ExternalLink } from 'lucide-react';
import { RaiderioProfile } from '@/features/views/api/raiderio.ts';
import { openExternalProfile } from '@/features/views/utils.ts';
import raiderio2 from '@/assets/raiderio.png';
import summoned from '@/assets/summoned.webp';

const MENU_HEIGHT = 84;
const GAP = 6;

type MenuPosition = { right: number; top?: number; bottom?: number };

interface CharacterMenuProps {
  character: RaiderioProfile;
}

export function CharacterMenu({ character }: Readonly<CharacterMenuProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < MENU_HEIGHT && rect.top > spaceBelow;

    setPosition({
      right: window.innerWidth - rect.right,
      ...(openUpwards
        ? { bottom: window.innerHeight - rect.top + GAP }
        : { top: rect.bottom + GAP }),
    });
  }, []);

  // Layout effect, not effect: the menu is `position: fixed` with no placement
  // until this runs, so measuring after paint shows it once at its static
  // position before it snaps under the button.
  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  const open = (service: 'raiderio' | 'summoned') => (e: React.MouseEvent) => {
    e.stopPropagation();
    openExternalProfile(character, service);
    setIsOpen(false);
  };

  return (
    <div className="char-menu-wrapper" ref={menuRef}>
      <button
        ref={buttonRef}
        className="char-menu-btn"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Open ${character.name} on another site`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <ExternalLink className="char-menu-btn-icon" />
      </button>
      {isOpen && (
        <div className="char-menu-dropdown" role="menu" style={position ?? undefined}>
          <button role="menuitem" className="char-menu-item" onClick={open('raiderio')}>
            <img src={raiderio2} alt="" aria-hidden={true} className="char-menu-icon" />
            Raider.io
          </button>
          <button role="menuitem" className="char-menu-item" onClick={open('summoned')}>
            <img src={summoned} alt="" aria-hidden={true} className="char-menu-icon" />
            Summoned.io
          </button>
        </div>
      )}
    </div>
  );
}
