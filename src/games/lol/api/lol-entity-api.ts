import { serviceRequest } from '@/shared/api/httpClient.ts';
import { VerifyResult } from '@/features/views/api/view-types.ts';
import { RiotId, riotIdKey } from '@/games/lol/model/riot-id.ts';

interface RiotIdsExistResponse {
  exist: RiotId[];
  nonExisting: RiotId[];
  unchecked: RiotId[];
}

export async function verifyRiotId(riotId: RiotId): Promise<VerifyResult> {
  const key = riotIdKey(riotId);
  try {
    const { nonExisting, unchecked } = await serviceRequest<RiotIdsExistResponse>(
      'POST',
      '/entities/exists',
      { entities: [{ type: 'lol', ...riotId }], game: 'LOL' },
    );
    if (nonExisting.some((n) => riotIdKey(n) === key)) return 'invalid';
    if (unchecked.some((u) => riotIdKey(u) === key)) return 'unverified';
    return 'valid';
  } catch {
    return 'unverified';
  }
}
