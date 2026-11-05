import { Outlet } from 'react-router-dom';
import { GameContext, GameSlug } from './game.ts';

export function GameLayout({ game }: { game: GameSlug }) {
  return (
    <GameContext.Provider value={game}>
      <Outlet />
    </GameContext.Provider>
  );
}
