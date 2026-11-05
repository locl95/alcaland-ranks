import { describe, it, expect } from 'vitest';
import { formatRank, lpChange, totalLp } from './ranked.ts';
import { League } from './lol-types.ts';

const league = (tier: string, rank: string, leaguePoints: number): League => ({
  tier,
  rank,
  leaguePoints,
  gamesPlayed: 10,
  winrate: 0.5,
  teamPosition: 'TOP',
  matches: [],
});

describe('totalLp', () => {
  it('ranks a higher division above more LP in a lower one', () => {
    expect(totalLp(league('GOLD', 'I', 0))).toBeGreaterThan(totalLp(league('GOLD', 'II', 99)));
    expect(totalLp(league('PLATINUM', 'IV', 0))).toBeGreaterThan(totalLp(league('GOLD', 'I', 99)));
  });

  it('puts apex tiers on one continuous LP scale above Diamond I', () => {
    expect(totalLp(league('MASTER', 'I', 0))).toBeGreaterThan(totalLp(league('DIAMOND', 'I', 99)));
    expect(totalLp(league('CHALLENGER', 'I', 900)) - totalLp(league('GRANDMASTER', 'I', 500))).toBe(
      400,
    );
  });
});

describe('lpChange', () => {
  it('counts LP across a promotion and a demotion', () => {
    expect(lpChange(league('GOLD', 'I', 10), league('GOLD', 'II', 80))).toBe(30);
    expect(lpChange(league('DIAMOND', 'I', 75), league('MASTER', 'I', 0))).toBe(-25);
  });

  it('has no change for a player without both snapshots', () => {
    expect(lpChange(league('GOLD', 'I', 10), null)).toBeNull();
    expect(lpChange(null, league('GOLD', 'I', 10))).toBeNull();
  });
});

describe('formatRank', () => {
  it('drops the division for apex tiers', () => {
    expect(formatRank(league('GOLD', 'I', 1))).toBe('Gold I · 1 LP');
    expect(formatRank(league('GRANDMASTER', 'I', 512))).toBe('Grandmaster · 512 LP');
  });
});
