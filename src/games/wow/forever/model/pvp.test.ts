import { describe, it, expect } from 'vitest';
import { hasPvpToShow } from './pvp.ts';

describe('hasPvpToShow', () => {
  it('shows PvP from the first honorable kill, even at rank 0', () => {
    expect(hasPvpToShow({ honorableKills: 1, rank: 0 })).toBe(true);
  });

  it('shows nothing without kills, or when PvP has not synced', () => {
    expect(hasPvpToShow({ honorableKills: 0, rank: 0 })).toBe(false);
    expect(hasPvpToShow(null)).toBe(false);
    expect(hasPvpToShow(undefined)).toBe(false);
  });
});
