import { describe, it, expect } from 'vitest';
import { matchesName } from './name-search.ts';

describe('matchesName', () => {
  it('ignores case, accents and surrounding spaces', () => {
    expect(matchesName('Lúcía', '  LUCI ')).toBe(true);
    expect(matchesName('Lucia', 'lúc')).toBe(true);
  });

  it('matches everything on an empty search, nothing on a foreign one', () => {
    expect(matchesName('Arthas', '')).toBe(true);
    expect(matchesName('Arthas', 'thrall')).toBe(false);
  });
});
