import { createContext, useContext } from 'react';

export type GameSlug = 'wow' | 'lol' | 'wow-forever';

/** `query` is how the backend names the game in query params (`?game=`). */
export const GAMES: { slug: GameSlug; label: string; query: string }[] = [
  { slug: 'wow', label: 'World of Warcraft Retail', query: 'wow' },
  { slug: 'lol', label: 'League of Legends', query: 'lol' },
  { slug: 'wow-forever', label: 'World of Warcraft Forever', query: 'wow_forever' },
];

export const gameQuery = (slug: GameSlug): string => GAMES.find((g) => g.slug === slug)!.query;

export const GameContext = createContext<GameSlug | null>(null);

export function useGame(): GameSlug {
  const game = useContext(GameContext);
  if (game === null) throw new Error('useGame must be used inside a GameLayout route');
  return game;
}
