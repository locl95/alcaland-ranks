import { League } from '@/games/lol/api/lol-types.ts';

const TIERS = [
  'IRON',
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'EMERALD',
  'DIAMOND',
  'MASTER',
  'GRANDMASTER',
  'CHALLENGER',
];
const DIVISIONS = ['IV', 'III', 'II', 'I'];
const APEX_TIERS = new Set(['MASTER', 'GRANDMASTER', 'CHALLENGER']);
const LP_PER_DIVISION = 100;
const LP_PER_TIER = DIVISIONS.length * LP_PER_DIVISION;

export const isApexTier = (tier: string): boolean => APEX_TIERS.has(tier);

export function totalLp({ tier, rank, leaguePoints }: League): number {
  if (isApexTier(tier)) return TIERS.indexOf('MASTER') * LP_PER_TIER + leaguePoints;
  return (
    TIERS.indexOf(tier) * LP_PER_TIER + DIVISIONS.indexOf(rank) * LP_PER_DIVISION + leaguePoints
  );
}

export const lpChange = (current: League | null, previous: League | null): number | null =>
  current && previous ? totalLp(current) - totalLp(previous) : null;

export const formatRank = ({ tier, rank, leaguePoints }: League): string => {
  const name = tier.charAt(0) + tier.slice(1).toLowerCase();
  return `${isApexTier(tier) ? name : `${name} ${rank}`} · ${leaguePoints} LP`;
};
