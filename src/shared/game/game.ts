import { createContext, useContext } from 'react';

export type GameSlug = 'wow' | 'lol';

export const GAMES: { slug: GameSlug; label: string }[] = [
  { slug: 'wow', label: 'World of Warcraft Retail' },
  { slug: 'lol', label: 'League of Legends' },
];

export const GameContext = createContext<GameSlug | null>(null);

export function useGame(): GameSlug {
  const game = useContext(GameContext);
  if (game === null) throw new Error('useGame must be used inside a GameLayout route');
  return game;
}
