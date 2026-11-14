import { WowPvp } from '@/games/wow/forever/api/forever-types.ts';

/** Shown from the first honorable kill: rank alone says nothing until then. */
export const hasPvpToShow = (pvp: WowPvp | null | undefined): pvp is WowPvp =>
  !!pvp && pvp.honorableKills > 0;
