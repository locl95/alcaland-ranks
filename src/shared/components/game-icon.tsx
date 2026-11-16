import { CSSProperties } from 'react';
import './game-icon.css';

/** A game's glyph, painted in the text colour around it whatever colour its file is. */
export function GameIcon({ src }: Readonly<{ src: string }>) {
  return (
    <span
      className="game-icon"
      style={{ '--game-icon': `url("${src}")` } as CSSProperties}
      aria-hidden={true}
    />
  );
}
