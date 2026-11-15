import { serviceRequest } from '@/shared/api/httpClient.ts';
import { VerifyResult } from '@/features/views/api/view-types.ts';
import { CharacterRef, characterKey } from '@/games/wow/forever/model/character.ts';

interface CharactersExistResponse {
  exist: CharacterRef[];
  nonExisting: CharacterRef[];
  unchecked: CharacterRef[];
}

export const toEntityRequest = ({ name, surname, region }: CharacterRef) => ({
  type: 'wow_forever',
  name: name.trim(),
  surname: surname.trim(),
  region,
});

export async function verifyCharacter(character: CharacterRef): Promise<VerifyResult> {
  const key = characterKey(character);
  try {
    const { nonExisting, unchecked } = await serviceRequest<CharactersExistResponse>(
      'POST',
      '/entities/exists',
      { entities: [toEntityRequest(character)], game: 'WOW_FOREVER' },
    );
    if (nonExisting.some((n) => characterKey(n) === key)) return 'invalid';
    if (unchecked.some((u) => characterKey(u) === key)) return 'unverified';
    return 'valid';
  } catch {
    return 'unverified';
  }
}

interface GuildExistsResponse {
  guild: { type: 'wow_forever'; name: string; region: string; blizzardId: number } | null;
}

/** A guild is named by name + region alone: no surname, and the backend rejects a realm. */
export const toGuildRequest = ({ name, region }: Pick<CharacterRef, 'name' | 'region'>) => ({
  type: 'wow_forever',
  name: name.trim(),
  region,
});

export async function verifyGuild({ name, region }: CharacterRef): Promise<VerifyResult> {
  try {
    const { guild } = await serviceRequest<GuildExistsResponse>('POST', '/entities/exists/guild', {
      game: 'WOW_FOREVER',
      name: name.trim(),
      region,
    });
    return guild ? 'valid' : 'invalid';
  } catch {
    return 'unverified';
  }
}
