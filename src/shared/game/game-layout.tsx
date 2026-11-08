import { useLayoutEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { GameContext, GameSlug } from './game.ts';

export function GameLayout({ game }: { game: GameSlug }) {
  // On <html>, not a wrapper div, so a game's theme also reaches the dialogs Radix
  // portals into <body>. Layout effect, so switching games never paints a frame
  // in the previous game's colours.
  useLayoutEffect(() => {
    document.documentElement.dataset.game = game;
    return () => {
      delete document.documentElement.dataset.game;
    };
  }, [game]);

  return (
    <GameContext.Provider value={game}>
      <Outlet />
    </GameContext.Provider>
  );
}
