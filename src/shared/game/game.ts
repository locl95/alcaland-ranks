import { createContext, useContext } from 'react';

export type GameSlug = 'wow' | 'lol' | 'wow-forever';

/**
 * Every game, keyed by slug so a slug without an entry fails to compile. `query` is how the
 * backend names the game in query params (`?game=`). Order is the switcher's order.
 */
const GAME_INFO: Record<GameSlug, { label: string; query: string }> = {
  wow: { label: 'World of Warcraft Retail', query: 'wow' },
  lol: { label: 'League of Legends', query: 'lol' },
  'wow-forever': { label: 'World of Warcraft Forever', query: 'wow_forever' },
};

export const GAMES = (Object.keys(GAME_INFO) as GameSlug[]).map((slug) => ({
  slug,
  label: GAME_INFO[slug].label,
}));

export const gameQuery = (slug: GameSlug): string => GAME_INFO[slug].query;

export const GameContext = createContext<GameSlug | null>(null);

export function useGame(): GameSlug {
  const game = useContext(GameContext);
  if (game === null) throw new Error('useGame must be used inside a GameLayout route');
  return game;
}
