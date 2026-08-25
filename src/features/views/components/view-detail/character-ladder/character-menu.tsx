import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { ExternalLink } from 'lucide-react';
import { RaiderioProfile } from '@/features/views/api/raiderio.ts';
import { openExternalProfile } from '@/features/views/utils.ts';
import raiderio2 from '@/assets/raiderio.png';
import summoned from '@/assets/summoned.webp';
import './character-menu.css';

interface CharacterMenuProps {
  character: RaiderioProfile;
}

export function CharacterMenu({ character }: Readonly<CharacterMenuProps>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="char-menu-btn" aria-label={`Open ${character.name} on another site`}>
          <ExternalLink className="char-menu-btn-icon" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          className="char-menu-dropdown"
          align="end"
          sideOffset={6}
          collisionPadding={12}
        >
          <DropdownMenuItem
            className="char-menu-item"
            onSelect={() => openExternalProfile(character, 'raiderio')}
          >
            <img src={raiderio2} alt="" aria-hidden={true} className="char-menu-icon" />
            Raider.io
          </DropdownMenuItem>
          <DropdownMenuItem
            className="char-menu-item"
            onSelect={() => openExternalProfile(character, 'summoned')}
          >
            <img src={summoned} alt="" aria-hidden={true} className="char-menu-icon" />
            Summoned.io
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
