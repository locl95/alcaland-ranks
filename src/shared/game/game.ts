import { createContext, useContext } from 'react';
import wowIcon from '@/assets/game-icons/wow.png';
import lolIcon from '@/assets/game-icons/lol.svg';

export type GameSlug = 'wow' | 'lol' | 'wow-forever';

/**
 * Every game, keyed by slug so a slug without an entry fails to compile. `query` is how the
 * backend names the game in query params (`?game=`). `icon` is a single-colour glyph the
 * switcher paints in its own colour, so its own colour does not matter. Order is the
 * switcher's order.
 */
const GAME_INFO: Record<GameSlug, { label: string; query: string; icon: string }> = {
  wow: { label: 'World of Warcraft Retail', query: 'wow', icon: wowIcon },
  lol: { label: 'League of Legends', query: 'lol', icon: lolIcon },
  'wow-forever': { label: 'World of Warcraft Forever', query: 'wow_forever', icon: wowIcon },
};

export const GAMES = (Object.keys(GAME_INFO) as GameSlug[]).map((slug) => ({
  slug,
  label: GAME_INFO[slug].label,
  icon: GAME_INFO[slug].icon,
}));

export const gameQuery = (slug: GameSlug): string => GAME_INFO[slug].query;

export const GameContext = createContext<GameSlug | null>(null);

export function useGame(): GameSlug {
  const game = useContext(GameContext);
  if (game === null) throw new Error('useGame must be used inside a GameLayout route');
  return game;
}
