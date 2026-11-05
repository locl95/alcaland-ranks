import { Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import './game-switcher.css';

const GAMES = [
  'World of Warcraft Retail',
  'World of Warcraft Hardcore Era',
  'World of Warcraft Forever',
  'League of Legends',
];

const CURRENT_GAME = GAMES[0];

export function GameSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="game-switcher-btn">
          {CURRENT_GAME}
          <ChevronDown className="game-switcher-chevron" aria-hidden={true} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          className="game-switcher-content"
          align="start"
          sideOffset={6}
          collisionPadding={12}
        >
          {GAMES.map((game) => (
            <DropdownMenuItem key={game} className="game-switcher-item">
              {game}
              {game === CURRENT_GAME && (
                <Check className="game-switcher-check" aria-label="Current" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
