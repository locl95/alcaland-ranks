import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { GAMES, useGame } from '@/shared/game/game.ts';
import './game-switcher.css';

export function GameSwitcher() {
  const navigate = useNavigate();
  const currentGame = useGame();
  const currentLabel = GAMES.find((g) => g.slug === currentGame)?.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="game-switcher-btn">
          {currentLabel}
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
          {GAMES.map(({ slug, label }) => (
            <DropdownMenuItem
              key={slug}
              className="game-switcher-item"
              onSelect={() => navigate(`/${slug}`)}
            >
              {label}
              {slug === currentGame && (
                <Check className="game-switcher-check" aria-label="Current" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
